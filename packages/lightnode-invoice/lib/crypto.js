const crypto = require('crypto');
const secp256k1 = require('secp256k1');

module.exports = {
  sha256,
  ecdsaSign,
  ecdsaRecovery,
  ecdsaVerify,
};

function sha256(data) {
  let hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest();
}

function ecdsaSign(message, privKey) {
  return secp256k1.sign(message, privKey);
}

function ecdsaRecovery(message, signature, recoveryFlag) {
  return secp256k1.recover(message, signature, recoveryFlag, true);
}

function ecdsaVerify(pubkey, message, signature) {
  return secp256k1.verify(message, signature, pubkey);
}
