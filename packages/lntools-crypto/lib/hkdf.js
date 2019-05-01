// @ts-check

const HKDF = require('futoin-hkdf');

module.exports = {
  hkdf,
};

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
