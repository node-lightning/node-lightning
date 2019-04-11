// @ts-check

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

/**
  Encrypts data using AES

  @param {Object} opts
  @param {Buffer} opts.key symmetric key
  @param {Buffer} opts.buffer plaintext to encrypt
 */
function aesEncrypt({ key, buffer }) {
  const cipher = crypto.createCipher('aes256', key);
  let result = cipher.update(buffer);
  result = Buffer.concat([result, cipher.final()]);
  return result;
}

/**
  Decrypts data using AES.

  @param {Object} opts
  @param {Buffer} opts.key symmetric key
  @param {Buffer} opts.buffer ciphertext to decrypt
 */
function aesDecrypt({ key, buffer }) {
  const decipher = crypto.createDecipher('aes256', key);
  let result = decipher.update(buffer);
  result = Buffer.concat([result, decipher.final()]);
  return result;
}

/**
  Generate a a secure key from the passphrase and salt
  by performing PBKDF2. If no salt is provided one is
  generated via randomBytes.

  @param {Object} opts
  @param {string} opts.passphrase
  @param {Buffer} [opts.salt] 16-byte buffer or more. Returns
  @returns {{ salt: Buffer, key: Buffer}}
 */
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

/**
  Hash using SHA256

  @param {Buffer} data data to hash
  @returns {Buffer} 32-byte buffer
 */
function sha256(data) {
  let hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest();
}

/**
  Hash using ripmd160

  @param {Buffer} data
  @returns {Buffer} 20-byte buffer
 */
function hash160(data) {
  let hash = crypto.createHash('ripemd160');
  hash.update(sha256(data));
  return hash.digest();
}

/**
  Elliptic Curve Diffie-Helman on secp256k1 takes a
  public key and point multiplies it by the private key.
  The resulting compressed public key value is hashed via
  sha256.

  @param {Buffer} rk 33-byte compressed public key
  @param {Buffer} k  32-byte private key
  @returns {Buffer} 32-byte sha256 of the point multiple
 */
function ecdh(rk, k) {
  return secp256k1.ecdh(rk, k);
}

/**
  HMAC-based Extact and Expand Key Derivation Function (HKDF)
  using SHA-256 and returning a 64-byte buffer.

  @param {Buffer} salt salt, variable length
  @param {Buffer} ikm initial key material, variable length
  @returns {Buffer} 64-byte buffer
 */
function hkdf(salt, ikm) {
  // @ts-ignore
  return HKDF(ikm, 64, { salt, hash: 'SHA-256' });
}

/**
  Encrypt data using authenticated encryption with associated data (AEAD)
  ChaCha20-Poly1305.

  @param {Buffer} k private key, 64-bytes
  @param {Buffer} n nonce, 12-bytes
  @param {Buffer} ad associated data
  @param {Buffer} plaintext raw data to encrypt
  @returns {Buffer} encrypted data + tag as a variable length buffer
 */
function ccpEncrypt(k, n, ad, plaintext) {
  const cipher = chacha.createCipher(k, n);
  cipher.setAAD(ad);
  let pad = cipher.update(plaintext);

  cipher.final();
  let tag = cipher.getAuthTag();

  return Buffer.concat([pad, tag]);
}

/**
  Decrypt data uusing authenticated encryption with associated data (AEAD)
  ChaCha20-Poly1305

  @param {Buffer} k private key, 64-bytes
  @param {Buffer} n nonce, 12-bytes
  @param {Buffer} ad associated data, variable length
  @param {Buffer} ciphertext encrypted data to decrypt
  @returns {Buffer} decrypteed data as a variable length Buffer
 */
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
