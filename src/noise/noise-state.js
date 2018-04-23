const winston = require('winston');
const { sha256, ecdh, hkdf, ccpEncrypt, ccpDecrypt } = require('../crypto');

/**
 * State machine for perforing noise-protocol handshake, message
 * encryption and decryption, and key rotation.
 */
class NoiseState {
  constructor({ ls, rs, es }) {
    this.ls = ls;
    this.rs = rs;
    this.es = es;

    this.protocolName = Buffer.from('Noise_XK_secp256k1_ChaChaPoly_SHA256');
    this.prologue = Buffer.from('lightning');
    this.h;
    this.ck;

    this.rk;
    this.sk;

    this.sn = Buffer.alloc(12);
    this.rn = Buffer.alloc(12);
  }

  async initialize() {
    winston.debug('initialize noise state');
    this.h = sha256(Buffer.from(this.protocolName));
    this.ck = this.h;
    this.h = sha256(Buffer.concat([this.h, this.prologue]));
    this.h = sha256(Buffer.concat([this.h, this.rs.compressed()]));
  }

  async initiatorAct1() {
    winston.debug('initiator act1');
    this.h = sha256(Buffer.concat([this.h, this.es.compressed()]));

    let ss = ecdh(this.rs.pub, this.es.priv);

    let temp_key1 = await hkdf(this.ck, ss);
    this.ck = temp_key1.slice(0, 32);
    temp_key1 = temp_key1.slice(32);

    let c = ccpEncrypt(temp_key1, Buffer.alloc(12), this.h, '');
    this.h = sha256(Buffer.concat([this.h, c]));
    let m = Buffer.concat([Buffer.alloc(1), this.es.compressed(), c]);
    return m;
  }

  async initiatorAct2Act3(m) {
    winston.debug('initiator act2');
    // ACT 2

    // 1. read exactly 50 bytes off the stream
    if (m.length !== 50) throw new Error('message must be 50 bytes');

    // 2. parse th read message m into v,re, and c
    let v = m.slice(0, 1)[0];
    let re = m.slice(1, 34);
    let c = m.slice(34);

    // 3. assert version is known version
    if (v !== 0) throw new Error('Unrecognized version');

    // 4. sha256(h || re.serializedCompressed');
    this.h = sha256(Buffer.concat([this.h, re]));

    // 5. ss = ECDH(re, e.priv);
    let ss = ecdh(re, this.es.priv);

    // 6. ck, temp_k2 = HKDF(cd, ss)
    let temp_k2 = await hkdf(this.ck, ss);
    this.ck = temp_k2.slice(0, 32);
    temp_k2 = temp_k2.slice(32);

    // 7. p = decryptWithAD()
    ccpDecrypt(temp_k2, Buffer.alloc(12), this.h, c);

    // 8. h = sha256(h || c)
    this.h = sha256(Buffer.concat([this.h, c]));

    // ACT 3
    winston.debug('initiator act3');
    c = ccpEncrypt(
      temp_k2,
      Buffer.from([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]),
      this.h,
      this.ls.compressed()
    );

    // 2. h = sha256(h || c)
    this.h = sha256(Buffer.concat([this.h, c]));

    // 3. ss = ECDH(re, s.priv)
    ss = ecdh(re, this.ls.priv);

    // 4. ck, temp_k3 = HKDF(ck, ss)
    let temp_k3 = await hkdf(this.ck, ss);
    this.ck = temp_k3.slice(0, 32);
    temp_k3 = temp_k3.slice(32);

    // 5. t = encryptWithAD(temp_k3, 0, h, zero)
    let t = ccpEncrypt(temp_k3, Buffer.alloc(12), this.h, '');

    // 6. sk, rk = hkdf(ck, zero)
    let sk = await hkdf(this.ck, '');
    let rk = sk.slice(32);
    sk = sk.slice(0, 32);

    this.sk = sk;
    this.rk = rk;

    // send m = 0 || c || t
    m = Buffer.concat([Buffer.alloc(1), c, t]);
    return m;
  }

  async encryptMessage(m) {
    // step 1/2. serialize m length into int16
    let l = Buffer.alloc(2);
    l.writeUInt16BE(m.length);

    // step 3. encrypt l, using chachapoly1305, sn, sk)
    let lc = ccpEncrypt(this.sk, this.sn, Buffer.alloc(0), l);

    // step 3a: increment sn
    if (this._incrementSendingNonce() >= 1000) await this._rotateSendingKeys();

    // step 4 encrypt m using chachapoly1305, sn, sk
    let c = ccpEncrypt(this.sk, this.sn, Buffer.alloc(0), m);

    // step 4a: increment sn
    if (this._incrementSendingNonce() >= 1000) await this._rotateSendingKeys();

    // step 5 return m to be sent
    return Buffer.concat([lc, c]);
  }

  async decryptLength(lc) {
    let l = ccpDecrypt(this.rk, this.rn, Buffer.alloc(0), lc);

    if (this._incrementRecievingNonce() >= 1000) await this._rotateRecievingKeys();

    return l.readUInt16BE();
  }

  async decryptMessage(c) {
    let m = ccpDecrypt(this.rk, this.rn, Buffer.alloc(0), c);

    if (this._incrementRecievingNonce() >= 1000) await this._rotateRecievingKeys();

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

  async _rotateSendingKeys() {
    winston.debug('rotating sending key');
    let result = await hkdf(this.ck, this.sk);
    this.sk = result.slice(32);
    this.ck = result.slice(0, 32);
    this.sn = Buffer.alloc(12);
  }
  async _rotateRecievingKeys() {
    winston.debug('rotating receiving key');
    let result = await hkdf(this.ck, this.rk);
    this.rk = result.slice(32);
    this.ck = result.slice(0, 32);
    this.rn = Buffer.alloc(12);
  }
}

module.exports = NoiseState;
