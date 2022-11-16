import { CommitmentSecret } from "./CommitmentSecret";

export type CommitmentSecretStoreItem = { index: bigint; secret: Buffer };

/**
 * Defined in BOLT3, this class compactly stored received commitment
 * secrets from our counterparty. Without this mechanism we are required
 * to store every commitment secret that we receive (2^48) which can be
 * a huge amount of data at 32-bytes per secret.
 *
 * Instead we can use the fact that later commitment secrets act as
 * prefixes for prior commitment secrets. We can then compactly store
 * only the secrets we need to derive older commitment secrets.
 */
export class CommitmentSecretStore {
    /**
     * Returns the index of the least-significant bit. This is used to
     * determine what the value at I is a prefix for.
     * @param I commitment
     */
    public static calcIndex(I: bigint): number {
        for (let i = 0n; i < 48n; i++) {
            if (I & (1n << i)) return Number(i);
        }
        return 48; // seed
    }

    private secrets: CommitmentSecretStoreItem[];

    constructor() {
        this.secrets = new Array(49) as CommitmentSecretStoreItem[];
        for (let i = 0; i < this.secrets.length; i++) {
            this.secrets[i] = { index: 0n, secret: undefined };
        }
    }

    /**
     * Insert the commitment secret into the store and verify that the
     * secret is able to derive all prior commitment secrets that we
     * already know about.
     *
     * @param secret 32-byte secp256k1 secret
     * @param i commitment number
     */
    public insert(secret: Buffer, i: bigint) {
        const B = CommitmentSecretStore.calcIndex(i);

        // validate that the new secret allows derivation of known keys
        // up to the new key
        for (let b = 0; b < B; b++) {
            const existing = this.secrets[b].secret;
            const derived = CommitmentSecret.derive(secret, this.secrets[b].index, B);
            if (!derived.equals(existing)) {
                throw new Error("The secret for I is incorrect");
            }
        }

        // update the position
        this.secrets[Number(B)].index = i;
        this.secrets[Number(B)].secret = secret;
    }

    /**
     * Derives old commitment secrets from the from the compact store.
     * Throws if we do not have the commitment secret for the specified
     * commitment nmber.
     * @param i derivation number starting at 2^48-1 down to zero.
     */
    public derive(i: bigint) {
        for (let b = 0; b < this.secrets.length; b++) {
            // construct a mask of the upper bits. Basically we lop off
            // the lower b bits and then right-shift back into place
            const mask = (0xffffffffffffn >> BigInt(b)) << BigInt(b);

            // Check if the prefix found using I & mask is one that we
            // can use to derive our value. If not, we need to try
            // another bit.
            if ((i & mask) === this.secrets[b].index && this.secrets[b].secret) {
                return CommitmentSecret.derive(this.secrets[b].secret, i, b);
            }
        }
        throw new Error("Index I hasn't been received yet");
    }
}
