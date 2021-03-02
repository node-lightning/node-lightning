import * as crypto from "@node-lightning/crypto";

export class ChannelKeys {
    /**
     * Derives a public key that can be used for local or remote
     * pubkey, htlc_pubkey, or delayed_pubkey
     *
     * Derived via:
     *  pubkey = basepoint + SHA256(per_commitment_point || basepoint) * G
     *
     * @param perCommitmentPoint 33-byte buffer
     * @param basePoint 33-byte base point
     * @returns 33-byte buffer
     */
    public static derivePubKey(perCommitmentPoint: Buffer, basePoint: Buffer): Buffer {
        const tweak = crypto.sha256(Buffer.concat([perCommitmentPoint, basePoint]));
        return crypto.publicKeyTweakAdd(basePoint, tweak, true);
    }

    /**
     * Derives the private keys based on local basepoint secrets and can
     * be used to derive per-commitment
     * - payment_scret
     * - delayedpayment_secret
     * - htlc_secret
     *
     * Derived via:
     *  privkey = basepoint_secret + SHA256(per_commitment_point || basepoint)
     *
     * @param perCommitmentPoint 32-byte buffer
     * @param basePointSecret 32-byte buffer
     * @return 32-byte buffer
     */
    public static derivePrivKey(perCommitmentPoint: Buffer, basePointSecret: Buffer): Buffer {
        const basePoint = crypto.getPublicKey(basePointSecret, true);
        const tweak = crypto.sha256(Buffer.concat([perCommitmentPoint, basePoint]));
        return crypto.privateKeyTweakAdd(basePointSecret, tweak);
    }

    /**
     * Derives the revocationpubkey blinded key for either local or
     * remote revocation pubkey generation.
     *
     * Derived via:
     *  revocationpubkey = revocation_basepoint * SHA256(revocation_basepoint || per_commitment_point) +
     *                     per_commitment_point * SHA256(per_commitment_point || revocation_basepoint)
     *
     * @param perCommitmentPoint 33-byte buffer
     * @param basePoint 33-byte buffer
     * @returns 33-byte buffer
     */
    public static deriveRevocationPubKey(perCommitmentPoint: Buffer, basePoint: Buffer): Buffer {
        const tweakA = crypto.sha256(Buffer.concat([basePoint, perCommitmentPoint]));
        const a = crypto.publicKeyTweakMul(basePoint, tweakA, true);

        const tweakB = crypto.sha256(Buffer.concat([perCommitmentPoint, basePoint]));
        const b = crypto.publicKeyTweakMul(perCommitmentPoint, tweakB, true);

        return crypto.publicKeyCombine([a, b], true);
    }

    /**
     * Derives the revocationprivkey which is used by the local node
     * and with a per_commitment_secret that was revealed by the
     * counterparty.
     *
     * Derived via:
     * revocationprivkey = revocation_basepoint_secret * SHA256(revocation_basepoint || per_commitment_point) +
     *                     per_commitment_secret * SHA256(per_commitment_point || revocation_basepoint)
     * @param perCommitmentPointSecret 32-byte buffer
     * @param basePointSecret 32-byte buffer
     */
    public static deriveRevocationPrivKey(
        perCommitmentPointSecret: Buffer,
        basePointSecret: Buffer,
    ): Buffer {
        const basePoint = crypto.getPublicKey(basePointSecret, true);
        const perCommitmentPoint = crypto.getPublicKey(perCommitmentPointSecret, true);

        const tweakA = crypto.sha256(Buffer.concat([basePoint, perCommitmentPoint]));
        const a = crypto.privateKeyTweakMul(basePointSecret, tweakA);

        const tweakB = crypto.sha256(Buffer.concat([perCommitmentPoint, basePoint]));
        const b = crypto.privateKeyTweakMul(perCommitmentPointSecret, tweakB);

        const result = crypto.privateKeyTweakAdd(a, b);
        return result;
    }
}
