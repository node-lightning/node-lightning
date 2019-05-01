// @ts-check

const crypto = require('crypto');

module.exports = {
  sha256,
  hash160,
};

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
