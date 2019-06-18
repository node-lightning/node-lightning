// @ts-check

const secp256k1 = require('secp256k1');

module.exports = {
  ecdh,
  verifySig,
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

/**
  Verifies an ECDSA signature and returns true or false
  if the signatures is valid.

  @param {Buffer} msg 32-byte message (256 hash or message)
  @param {Buffer} sig 32-byte
  @param {Buffer} pubkey 33-byte compressed pubkey
  @returns {boolean} true when signature is valid
 */
function verifySig(msg, sig, pubkey) {
  return secp256k1.verify(msg, sig, pubkey);
}
