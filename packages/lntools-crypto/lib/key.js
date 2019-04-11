// @ts-check

const crypto = require('crypto');
const secp256k1 = require('secp256k1');

module.exports = {
  generateRandomKey,
  generateKey,
  generatePubKey,
};

/**
  An elliptic curve key store. This class optionally contains the private
  key and a public key in either the compressed or uncompressed format.

  @typedef ECKey
  @property {Buffer} [priv] private key Buffer, should be 32-bytes
  @property {Buffer} pub prublic key Buffer in either compressed (33-bytes)
    or uncompressed (64-bytes) format
  @property {() => Buffer} compressed  Return the compressed public key for the elliptic curve key regardless
    of whether the public key is stored as a compressed or uncompressed key.
*/

/**
  Generates a cryptographially secure key and returns
  an ECKey object

  @remarks This method uses crypto.randomBytes to
  generate the random value.

  @returns {ECKey} the result elliptic curve key
 */
function generateRandomKey() {
  let privateKey = crypto.randomBytes(32);
  return {
    priv: privateKey,
    pub: secp256k1.publicKeyCreate(privateKey, true),
    compressed() {
      return this.pub;
    },
  };
}

/**
  Generaets an ECKey object from the hex-encoded private
  key provided.

  @param {string} privKeyHex hex-encoded private key

  @returns {ECKey}
 */
function generateKey(privKeyHex) {
  let privateKey = Buffer.from(privKeyHex, 'hex');
  return {
    priv: privateKey,
    pub: secp256k1.publicKeyCreate(privateKey, true),
    compressed() {
      return this.pub;
    },
  };
}

/**
  Generates an ECKey object from the hex-encoded public
  key provided.

  @param {string|Buffer} compressedKey hex-encoded public key

  @returns {ECKey}
 */
function generatePubKey(compressedKey) {
  let publicKey = Buffer.isBuffer(compressedKey)
    ? compressedKey
    : Buffer.from(compressedKey, 'hex');
  return {
    pub: publicKey,
    compressed() {
      return this.pub;
    },
  };
}
