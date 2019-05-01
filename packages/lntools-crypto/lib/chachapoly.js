// @ts-check

const chacha = require('chacha-native');

module.exports = {
  ccpEncrypt,
  ccpDecrypt,
};

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
  // @ts-ignore
  let pad = cipher.update(plaintext);
  // @ts-ignore
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
    // @ts-ignore
    return decipher.final();
  }
  if (ciphertext.length > 16) {
    let tag = ciphertext.slice(ciphertext.length - 16);
    let pad = ciphertext.slice(0, ciphertext.length - 16);
    decipher.setAuthTag(tag);
    // @ts-ignore
    let m = decipher.update(pad);
    // @ts-ignore
    let f = decipher.final();
    m = Buffer.concat([m, f]);
    return m;
  }
}
