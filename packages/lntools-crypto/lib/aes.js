// @ts-check

const crypto = require('crypto');

module.exports = {
  aesEncrypt,
  aesDecrypt,
  createAesKey,
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
function createAesKey({ passphrase, salt }) {
  if (!salt) {
    salt = crypto.randomBytes(16);
  }
  let key = crypto.pbkdf2Sync(passphrase, salt, 100000, 128, 'sha512');
  return {
    salt,
    key,
  };
}
