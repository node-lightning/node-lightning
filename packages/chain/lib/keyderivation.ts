import { sha256 } from "@lntools/crypto";
import secp256k1 from "secp256k1";

/**
 * Derives a public key that can be used for: localpubkey, remotepubkey,
 * local_htlcpubkey, remote_htlcpubkey, local_delayedpubkey, remote_delayedpubkey.
 *
 * Derived via:
 *  pubkey = basepoint + SHA256(per_commitment_point || basepoint) * G
 *
 * @param perCommitmentPoint 32-byte buffer
 * @param basePoint 32-byte base point
 * @returns 32-byte buffer
 */
export function derivePubKey(perCommitmentPoint: Buffer, basePoint: Buffer): Buffer {
    const tweak = sha256(Buffer.concat([perCommitmentPoint, basePoint]));
    return secp256k1.publicKeyTweakAdd(basePoint, tweak, true);
}

/**
 * Derives the private keys if the basepoint secret is known for
 * localpubkey local_htlcpubkey.
 *
 * Derived via:
 *  privkey = basepoint_secret + SHA256(per_commitment_point || basepoint)
 *
 * @param perCommitmentPoint 32-byte buffer
 * @param basePointSecret 32-byte buffer
 * @return 32-byte buffer
 */
export function derivePrivKey(perCommitmentPoint: Buffer, basePointSecret: Buffer): Buffer {
    const basePoint = secp256k1.publicKeyCreate(basePointSecret, true);
    const tweak = sha256(Buffer.concat([perCommitmentPoint, basePoint]));
    return secp256k1.privateKeyTweakAdd(basePointSecret, tweak);
}

/**
 * Derives the revocationpubkey blinded key
 *
 * Derived via:
 *  revocationpubkey = revocation_basepoint * SHA256(revocation_basepoint || per_commitment_point) +
 *                     per_commitment_point * SHA256(per_commitment_point || revocation_basepoint)
 *
 * @param perCommitmentPoint 32-byte buffer
 * @param basePoint 32-byte buffer
 * @returns 32-byte buffer
 */
export function deriveRevocationPubKey(perCommitmentPoint: Buffer, basePoint: Buffer): Buffer {
    const tweakA = sha256(Buffer.concat([basePoint, perCommitmentPoint]));
    const a = secp256k1.publicKeyTweakMul(basePoint, tweakA, true);

    const tweakB = sha256(Buffer.concat([perCommitmentPoint, basePoint]));
    const b = secp256k1.publicKeyTweakMul(perCommitmentPoint, tweakB, true);

    return secp256k1.publicKeyCombine([a, b], true);
}

/**
 * Derives the revocationprivkey
 *
 * Derived via:
 * revocationprivkey = revocation_basepoint_secret * SHA256(revocation_basepoint || per_commitment_point) +
 *                     per_commitment_secret * SHA256(per_commitment_point || revocation_basepoint)
 * @param perCommitmentPointSecret 32-byte buffer
 * @param basePointSecret 32-byte buffer
 */
export function deriveRevocationPrivKey(perCommitmentPointSecret: Buffer, basePointSecret: Buffer): Buffer {
  const basePoint = secp256k1.publicKeyCreate(basePointSecret);
  const perCommitmentPoint = secp256k1.publicKeyCreate(perCommitmentPointSecret);

  const tweakA = sha256(Buffer.concat([basePoint, perCommitmentPoint]));
  const a = secp256k1.privateKeyTweakMul(basePointSecret, tweakA);

  const tweakB = sha256(Buffer.concat([perCommitmentPoint, basePoint]));
  const b = secp256k1.privateKeyTweakMul(perCommitmentPointSecret, tweakB);

  return secp256k1.privateKeyTweakAdd(a, b);
} // prettier-ignore
