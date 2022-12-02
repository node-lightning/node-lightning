import { sha256 } from "@node-lightning/crypto";

export class CommitmentSecret {
    /**
     * Generic version of commitment secret generator as defined in
     * BOLT3.
     *
     * This function works by decrementing from bits to 0. If the index
     * number has the corresponding bit set, it flips the bit in the
     * secret and hashes it.
     *
     * The natural conclusion is the first secret flips every bit and
     * the last secret flips zero (and is thus the seed).
     *
     * This function can be used for generate the local per-commitment
     * secret based on the per-commitment seed and a commitment index
     * (in this case it) generates all 48 bits.
     *
     * This function can also be used to generate prior commitment
     * secrets from a newer secret, which acts as a prefix.
     *
     * @param seed base secret that will be used to derive from
     * @param i secret at index I to generate
     * @param bits bits to evaluate, default is 48
     */
    public static derive(seed: Buffer, i: bigint, bits: number = 48): Buffer {
        let p = Buffer.from(seed);

        for (let b = bits - 1; b >= 0; b--) {
            if (i & (1n << BigInt(b))) {
                // flip the specified bit in the specific byte
                const byteIndex = Math.floor(b / 8);
                const bitIndex = b % 8;
                p[byteIndex] = p[byteIndex] ^ (1 << bitIndex);
                p = sha256(p);
            }
        }
        return p;
    }
}
