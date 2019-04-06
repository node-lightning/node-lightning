const crypto = require('crypto');
const secp256k1 = require('secp256k1');

module.exports = {
  generateRandomKey,
  generateKey,
  generatePubKey,
};

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

function generatePubKey(compressedKey) {
  let publicKey = Buffer.from(compressedKey, 'hex');
  return {
    pub: publicKey,
    compressed() {
      return this.pub;
    },
  };
}
