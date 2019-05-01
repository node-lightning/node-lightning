// @ts-check

const secp256k1 = require('secp256k1');

module.exports = {
  ecdh,
};

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
