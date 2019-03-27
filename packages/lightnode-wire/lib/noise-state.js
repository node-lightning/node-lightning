const winston = require('winston');
const { sha256, ecdh, hkdf, ccpEncrypt, ccpDecrypt } = require('@lightnode/crypto');
const { generatePubKey } = require('@lightnode/crypto');

/**
 * State machine for perforing noise-protocol handshake, message
 * encryption and decryption, and key rotation.
 */
class NoiseState {
  constructor({ ls, rs, es }) {
    this.ls = ls;
    this.rs = rs;
    this.es = es;
    this.re;

    this.protocolName = Buffer.from('Noise_XK_secp256k1_ChaChaPoly_SHA256');
    this.prologue = Buffer.from('lightning');
    this.h;
    this.ck;

    this.rk;
    this.sk;

    this.sn = Buffer.alloc(12);
    this.rn = Buffer.alloc(12);
  }

  _initialize(key) {
    winston.debug('initialize noise state');
    this.h = sha256(Buffer.from(this.protocolName));
    this.ck = this.h;
    this.h = sha256(Buffer.concat([this.h, this.prologue]));
    this.h = sha256(Buffer.concat([this.h, key.compressed()]));
  }

  initiatorAct1() {
    winston.debug('initiator act1');
    this._initialize(this.rs);
    this.h = sha256(Buffer.concat([this.h, this.es.compressed()]));

    let ss = ecdh(this.rs.pub, this.es.priv);

    let temp_k1 = hkdf(this.ck, ss);
    this.ck = temp_k1.slice(0, 32);
    this.temp_k1 = temp_k1.slice(32);

    let c = ccpEncrypt(this.temp_k1, Buffer.alloc(12), this.h, '');
    this.h = sha256(Buffer.concat([this.h, c]));

    let m = Buffer.concat([Buffer.alloc(1), this.es.compressed(), c]);
    return m;
  }

  initiatorAct2(m) {
    winston.debug('initiator act2');
    // ACT 2

    // 1. read exactly 50 bytes off the stream
    if (m.length !== 50) throw new Error('ACT2_READ_FAILED');

    // 2. parse th read message m into v,re, and c
    let v = m.slice(0, 1)[0];
    let re = m.slice(1, 34);
    let c = m.slice(34);

    // 2a. convert re to public key
    this.re = generatePubKey(re);

    // 3. assert version is known version
    if (v !== 0) throw new Error('ACT2_BAD_VERSION');

    // 4. sha256(h || re.serializedCompressed');
    this.h = sha256(Buffer.concat([this.h, this.re.compressed()]));

    // 5. ss = ECDH(re, e.priv);
    let ss = ecdh(this.re.compressed(), this.es.priv);

    // 6. ck, temp_k2 = HKDF(cd, ss)
    let temp_k2 = hkdf(this.ck, ss);
    this.ck = temp_k2.slice(0, 32);
    this.temp_k2 = temp_k2.slice(32);

    // 7. p = decryptWithAD()
    ccpDecrypt(this.temp_k2, Buffer.alloc(12), this.h, c);

    // 8. h = sha256(h || c)
    this.h = sha256(Buffer.concat([this.h, c]));
  }

  initiatorAct3() {
    // ACT 3
    winston.debug('initiator act3');

    let c = ccpEncrypt(
      this.temp_k2,
      Buffer.from([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]),
      this.h,
      this.ls.compressed()
    );

    // 2. h = sha256(h || c)
    this.h = sha256(Buffer.concat([this.h, c]));

    // 3. ss = ECDH(re, s.priv)
    let ss = ecdh(this.re.compressed(), this.ls.priv);

    // 4. ck, temp_k3 = HKDF(ck, ss)
    let temp_k3 = hkdf(this.ck, ss);
    this.ck = temp_k3.slice(0, 32);
    this.temp_k3 = temp_k3.slice(32);

    // 5. t = encryptWithAD(temp_k3, 0, h, zero)
    let t = ccpEncrypt(this.temp_k3, Buffer.alloc(12), this.h, '');

    // 6. sk, rk = hkdf(ck, zero)
    let sk = hkdf(this.ck, '');
    this.rk = sk.slice(32);
    this.sk = sk.slice(0, 32);

    // 7. send m = 0 || c || t
    let m = Buffer.concat([Buffer.alloc(1), c, t]);
    return m;
  }

  receiveAct1(m) {
    this._initialize(this.ls);

    winston.debug('receive act1');

    // 1. read exactly 50 bytes off the stream
    if (m.length !== 50) throw new Error('ACT1_READ_FAILED');

    // 2. parse th read message m into v,re, and c
    let v = m.slice(0, 1)[0];
    let re = m.slice(1, 34);
    let c = m.slice(34);
    this.re = re;

    // 3. assert version is known version
    if (v !== 0) throw new Error('ACT1_BAD_VERSION');

    // 4. sha256(h || re.serializedCompressed');
    this.h = sha256(Buffer.concat([this.h, re]));

    // 5. ss = ECDH(re, ls.priv);
    let ss = ecdh(re, this.ls.priv);

    // 6. ck, temp_k1 = HKDF(cd, ss)
    let temp_k1 = hkdf(this.ck, ss);
    this.ck = temp_k1.slice(0, 32);
    this.temp_k1 = temp_k1.slice(32);

    // 7. p = decryptWithAD(temp_k1, 0, h, c)
    ccpDecrypt(this.temp_k1, Buffer.alloc(12), this.h, c);

    // 8. h = sha256(h || c)
    this.h = sha256(Buffer.concat([this.h, c]));
  }

  recieveAct2() {
    // 1. e = generateKey() => done in initialization

    // 2. h = sha256(h || e.pub.compressed())
    this.h = sha256(Buffer.concat([this.h, this.es.compressed()]));

    // 3. ss = ecdh(re, e.priv)
    let ss = ecdh(this.re, this.es.priv);

    // 4. ck, temp_k2 = hkdf(ck, ss)
    let temp_k2 = hkdf(this.ck, ss);
    this.ck = temp_k2.slice(0, 32);
    this.temp_k2 = temp_k2.slice(32);

    // 5. c = encryptWithAd(temp_k2, 0, h, zero)
    let c = ccpEncrypt(this.temp_k2, Buffer.alloc(12), this.h, '');

    // 6. h = sha256(h || c)
    this.h = sha256(Buffer.concat([this.h, c]));

    // 7. m = 0 || e.pub.compressed() Z|| c
    let m = Buffer.concat([Buffer.alloc(1), this.es.compressed(), c]);
    return m;
  }

  receiveAct3(m) {
    // 1. read exactly 66 bytes from the network buffer
    if (m.length !== 66) throw new Error('ACT3_READ_FAILED');

    // 2. parse m into v, c, t
    let v = m.slice(0, 1)[0];
    let c = m.slice(1, 50);
    let t = m.slice(50);

    // 3. validate v is recognized
    if (v !== 0) throw new Error('ACT3_BAD_VERSION');

    // 4. rs = decryptWithAD(temp_k2, 1, h, c)
    let rs = ccpDecrypt(this.temp_k2, Buffer.from('000000000100000000000000', 'hex'), this.h, c);
    this.rs = generatePubKey(rs);

    // 5. h = sha256(h || c)
    this.h = sha256(Buffer.concat([this.h, c]));

    // 6. ss = ECDH(rs, e.priv)
    let ss = ecdh(this.rs.compressed(), this.es.priv);

    // 7. ck, temp_k3 = hkdf(cs, ss)
    let temp_k3 = hkdf(this.ck, ss);
    this.ck = temp_k3.slice(0, 32);
    this.temp_k3 = temp_k3.slice(32);

    // 8. p = decryptWithAD(temp_k3, 0, h, t)
    ccpDecrypt(this.temp_k3, Buffer.alloc(12), this.h, t);

    // 9. rk, sk = hkdf(ck, zero)
    let sk = hkdf(this.ck, '');
    this.rk = sk.slice(0, 32);
    this.sk = sk.slice(32);

    // 10. rn = 0, sn = 0
    this.rn = 0;
    this.sn = 0;
  }

  encryptMessage(m) {
    // step 1/2. serialize m length into int16
    let l = Buffer.alloc(2);
    l.writeUInt16BE(m.length);

    // step 3. encrypt l, using chachapoly1305, sn, sk)
    let lc = ccpEncrypt(this.sk, this.sn, Buffer.alloc(0), l);

    // step 3a: increment sn
    if (this._incrementSendingNonce() >= 1000) this._rotateSendingKeys();

    // step 4 encrypt m using chachapoly1305, sn, sk
    let c = ccpEncrypt(this.sk, this.sn, Buffer.alloc(0), m);

    // step 4a: increment sn
    if (this._incrementSendingNonce() >= 1000) this._rotateSendingKeys();

    // step 5 return m to be sent
    return Buffer.concat([lc, c]);
  }

  decryptLength(lc) {
    let l = ccpDecrypt(this.rk, this.rn, Buffer.alloc(0), lc);

    if (this._incrementRecievingNonce() >= 1000) this._rotateRecievingKeys();

    return l.readUInt16BE();
  }

  decryptMessage(c) {
    let m = ccpDecrypt(this.rk, this.rn, Buffer.alloc(0), c);

    if (this._incrementRecievingNonce() >= 1000) this._rotateRecievingKeys();

    return m;
  }

  _incrementSendingNonce() {
    let newValue = this.sn.readUInt16LE(4) + 1;
    this.sn.writeUInt16LE(newValue, 4);
    return newValue;
  }

  _incrementRecievingNonce() {
    let newValue = this.rn.readUInt16LE(4) + 1;
    this.rn.writeUInt16LE(newValue, 4);
    return newValue;
  }

  _rotateSendingKeys() {
    winston.debug('rotating sending key');
    let result = hkdf(this.ck, this.sk);
    this.sk = result.slice(32);
    this.ck = result.slice(0, 32);
    this.sn = Buffer.alloc(12);
  }

  _rotateRecievingKeys() {
    winston.debug('rotating receiving key');
    let result = hkdf(this.ck, this.rk);
    this.rk = result.slice(32);
    this.ck = result.slice(0, 32);
    this.rn = Buffer.alloc(12);
  }
}

module.exports = NoiseState;
