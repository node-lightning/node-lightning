const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

module.exports = {
  generateKey,
};

function generateKey(privKeyHex) {
  let curve;
  if (privKeyHex) {
    curve = ec.keyFromPrivate(privKeyHex);
  } else {
    curve = ec.genKeyPair();
  }
  return {
    priv: curve.getPrivate(),
    pub: curve.getPublic(),
    compressed() {
      let hex = curve.getPublic(true, 'hex');
      return Buffer.from(hex, 'hex');
    },
  };
}
