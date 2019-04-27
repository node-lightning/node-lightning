// @ts-check

const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const BN = require('bn.js');

const minPrivateKey = new BN(Buffer.from('01', 'hex'));
const maxPrivateKey = new BN(Buffer.from('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140', 'hex')); // prettier-ignore

module.exports = {
  validPrivateKey,
  createPrivateKey,
  getPublicKey,
};

/**
  Returns true when the Buffer represents a 256-bit number that is between
  0x1 and 0xffffffffffffffffffffffffffffffffbaaedce6af48a03bbfd25e8cd0364140
  as documented in https://en.bitcoin.it/wiki/Private_key

  @param {Buffer} privKey
  @returns {boolean}
 */
function validPrivateKey(privKey) {
  if (!Buffer.isBuffer(privKey)) return false;
  if (privKey.length !== 32) return false;

  let val = new BN(privKey);
  return val.gte(minPrivateKey) && val.lte(maxPrivateKey);
}

/**
  Generates a cryptographially secure 256-bit private key
  that is valid for elliptic curve secp256k1

  @remarks This method uses crypto.randomBytes to
  generate the random value. It may be better to use a
  HRBG

  @returns {Buffer} the 256-bit private key
 */
function createPrivateKey() {
  let result;
  do {
    result = crypto.randomBytes(32);
  } while (!validPrivateKey);
  return result;
}

/**
  Gets the public key in the ellitic curve secp256k1
  from the provided private key

  @param {Buffer} privKey 256-bit private key
  @returns {Buffer} 33-byte buffer for compressed,
  65-byte buffer for uncompressed
 */
function getPublicKey(privKey, compressed = true) {
  return secp256k1.publicKeyCreate(privKey, compressed);
}
