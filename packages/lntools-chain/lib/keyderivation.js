const { sha256 } = require('@lntools/crypto');
const secp256k1 = require('secp256k1');

module.exports = {
  derivePubKey,
  derivePrivKey,
  deriveRevocationPubKey,
  deriveRevocationPrivKey,
};

/**
 * Derives a public key that can be used for: localpubkey, remotepubkey,
 * local_htlcpubkey, remote_htlcpubkey, local_delayedpubkey, remote_delayedpubkey.
 *
 * Derived via:
 *  pubkey = basepoint + SHA256(per_commitment_point || basepoint) * G
 *
 * @param {Buffer} perCommitmentPoint 32-byte buffer
 * @param {Buffer} basePoint 32-byte base point
 * @returns {Buffer} 32-byte buffer
 */
function derivePubKey(perCommitmentPoint, basePoint) {
  let tweak = sha256(Buffer.concat([perCommitmentPoint, basePoint]));
  return secp256k1.publicKeyTweakAdd(basePoint, tweak, true);
}

/**
 * Derives the private keys if the basepoint secret is known for
 * localpubkey local_htlcpubkey.
 *
 * Derived via:
 *  privkey = basepoint_secret + SHA256(per_commitment_point || basepoint)
 *
 * @param {Buffer} perCommitmentPoint 32-byte buffer
 * @param {Buffer} basePointSecret 32-byte buffer
 * @return {Buffer} 32-byte buffer
 */
function derivePrivKey(perCommitmentPoint, basePointSecret) {
  let basePoint = secp256k1.publicKeyCreate(basePointSecret, true);
  let tweak = sha256(Buffer.concat([perCommitmentPoint, basePoint]));
  return secp256k1.privateKeyTweakAdd(basePointSecret, tweak);
}

/**
 * Derives the revocationpubkey blinded key
 *
 * Derived via:
 *  revocationpubkey = revocation_basepoint * SHA256(revocation_basepoint || per_commitment_point) +
 *                     per_commitment_point * SHA256(per_commitment_point || revocation_basepoint)
 *
 * @param {Buffer} perCommitmentPoint 32-byte buffer
 * @param {Buffer} basePoint 32-byte buffer
 * @returns {Buffer} 32-byte buffer
 */
function deriveRevocationPubKey(perCommitmentPoint, basePoint) {
  let tweakA = sha256(Buffer.concat([basePoint, perCommitmentPoint]));
  let a = secp256k1.publicKeyTweakMul(basePoint, tweakA, true);

  let tweakB = sha256(Buffer.concat([perCommitmentPoint, basePoint]));
  let b = secp256k1.publicKeyTweakMul(perCommitmentPoint, tweakB, true);

  return secp256k1.publicKeyCombine([a, b], true);
}

/**
 * Derives the revocationprivkey
 *
 * Derived via:
 * revocationprivkey = revocation_basepoint_secret * SHA256(revocation_basepoint || per_commitment_point) +
 *                     per_commitment_secret * SHA256(per_commitment_point || revocation_basepoint)
 * @param {*} perCommitmentPointSecret
 * @param {*} basePointSecret
 */
function deriveRevocationPrivKey(perCommitmentPointSecret, basePointSecret) {
  let basePoint = secp256k1.publicKeyCreate(basePointSecret);
  let perCommitmentPoint = secp256k1.publicKeyCreate(perCommitmentPointSecret);

  let tweakA = sha256(Buffer.concat([basePoint, perCommitmentPoint]));
  let a = secp256k1.privateKeyTweakMul(basePointSecret, tweakA);

  let tweakB = sha256(Buffer.concat([perCommitmentPoint, basePoint]));
  let b = secp256k1.privateKeyTweakMul(perCommitmentPointSecret, tweakB);

  return secp256k1.privateKeyTweakAdd(a, b);
}
