const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const HKDF = require('futoin-hkdf');
const chacha = require('chacha');

module.exports = {
  aesEncrypt,
  aesDecrypt,
  generateKey,
  sha256,
  hash160,
  ecdh,
  hkdf,
  ccpEncrypt,
  ccpDecrypt,
};

function aesEncrypt({ key, buffer }) {
  const cipher = crypto.createCipher('aes256', key);
  let result = cipher.update(buffer);
  result = Buffer.concat([result, cipher.final()]);
  return result;
}

function aesDecrypt({ key, buffer }) {
  const decipher = crypto.createDecipher('aes256', key);
  let result = decipher.update(buffer);
  result = Buffer.concat([result, decipher.final()]);
  return result;
}

function generateKey({ passphrase, salt }) {
  if (!salt) {
    salt = crypto.randomBytes(16);
  }
  let key = crypto.pbkdf2Sync(passphrase, salt, 100000, 128, 'sha512');
  return {
    salt,
    key,
  };
}

function sha256(data) {
  let hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest();
}

function hash160(data) {
  let hash = crypto.createHash('ripemd160');
  hash.update(sha256(data));
  return hash.digest();
}

function ecdh(rk, k) {
  // via secp256k1
  return secp256k1.ecdh(rk, k);

  // via elliptic.js
  // let priv = secp256k1.keyFromPrivate(k);
  // let pub = secp256k1.keyFromPublic(rk);
  // let shared = pub.getPublic().mul(priv.getPrivate());
  // shared = secp256k1.keyFromPublic(shared).getPublic(true, 'hex');
  // return sha256(Buffer.from(shared, 'hex'));

  // via tiny-secp256k1
  // return sha256(secp256k1.pointMultiply(rk, k, true));
}

function hkdf(salt, ikm) {
  return HKDF(ikm, 64, { salt, hash: 'SHA-256' });
}

function ccpEncrypt(k, n, ad, plaintext) {
  const cipher = chacha.createCipher(k, n);
  cipher.setAAD(ad);
  let pad = cipher.update(plaintext);

  cipher.final();
  let tag = cipher.getAuthTag();

  return Buffer.concat([pad, tag]);
}

function ccpDecrypt(k, n, ad, ciphertext) {
  const decipher = chacha.createDecipher(k, n);
  decipher.setAAD(ad);

  if (ciphertext.length == 16) {
    decipher.setAuthTag(ciphertext);
    return decipher.final();
  }
  if (ciphertext.length > 16) {
    let tag = ciphertext.slice(ciphertext.length - 16);
    let pad = ciphertext.slice(0, ciphertext.length - 16);
    decipher.setAuthTag(tag);
    let m = decipher.update(pad);
    let f = decipher.final();
    m = Buffer.concat([m, f]);
    return m;
  }
}
