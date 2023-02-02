import { LockTime, Sequence } from "@node-lightning/bitcoin";
import { bigFromBufBE } from "@node-lightning/bufio";
import { sha256 } from "@node-lightning/crypto";

export class CommitmentNumber {
    /**
     * The commitment number is used per channel per peer. It is a 48-bit
     * number so the max value is 2^48-1.
     */
    public static MAX_COMMITMENT_NUMBER = 281474976710655n;

    /**
     * Using the obscured commitment number, creates a Sequence with
     * the upper byte set to 0x80 and the lower three bytes set to the
     * upper 3 bytes of the 48-bit commitment number.
     *
     * The upper most byte is set to 0x80 so that the relative lock time
     * is disabled.
     *
     * @param commitment commitment number to obscure
     */
    public static getSequence(obscurred: bigint): Sequence {
        return new Sequence(Number((0x80n << 24n) | (obscurred >> 24n)));
    }

    /**
     * Using the obscured commitment number, creates a LockTime with
     * the upper byte set to 0x20 and the lower three bytes set to the
     * lower 3 bytes of the 48-bit commitment number.
     *
     * The uppermost byte is set to 0x20 so the LockTime uses a time
     * based absolute locktime that has already expired.
     *
     * @param obscurred obscurred commitment number
     */
    public static getLockTime(obscurred: bigint): LockTime {
        return new LockTime(Number((0x20n << 24n) | (obscurred & 0xffffffn)));
    }

    /**
     * Reveals the commitment number provided by the nSequence and
     * nLockTime values. This function reverses the obscurring using the
     * known payment base points.
     *
     * @param locktime
     * @param sequence
     */
    public static reveal(
        locktime: LockTime,
        sequence: Sequence,
        openBasePoint: Buffer,
        acceptBasePoint: Buffer,
    ): number {
        const hash = CommitmentNumber.getHash(openBasePoint, acceptBasePoint);
        const upper = BigInt(sequence.value & 0xffffff) << 24n;
        const lower = BigInt(locktime.value & 0xffffff);
        return Number(hash ^ (upper | lower));
    }

    /**
     * Defined in BOLT3, the obscurred commitment number is attached to the
     * commitment transaction. The 48-bit commitment number is broken into
     * two pieces, the lower 3-bytes are obscured in nLocketime and the
     * upper 3-bytes are obscured in the funding input's nSequence.
     *
     * The obscurred commitment number is calculated as the:
     * sha256(open_channel payment_basepoint || accept_channel payment_basepoint) ^ commitment_number
     * @param commitment
     * @param openBasePoint
     * @param acceptBasePoint
     */
    public static obscure(
        commitment: number,
        openBasePoint: Buffer,
        acceptBasePoint: Buffer,
    ): bigint {
        return CommitmentNumber.getHash(openBasePoint, acceptBasePoint) ^ BigInt(commitment);
    }

    /**
     * Obtains the lower 6-bytes from the sha256 of the open_channel
     * basepoint and the accept_channel basepoint.
     * @param openBasePoint
     * @param acceptBasePoint
     */
    private static getHash(openBasePoint: Buffer, acceptBasePoint: Buffer): bigint {
        const hash = sha256(Buffer.concat([openBasePoint, acceptBasePoint]));
        return bigFromBufBE(hash.slice(hash.length - 6));
    }

    constructor(public value: bigint) {}

    /**
     * Defined in BOLT 3, the per-commitment secret is created for each
     * commitment number. This value is used as input into the key
     * derivation function that starts its index at 2^48-1 and works
     * backwards to zero.
     */
    public get secretIndex(): bigint {
        return CommitmentNumber.MAX_COMMITMENT_NUMBER - this.value;
    }

    /**
     * Gets the next commitment number
     */
    public next(): CommitmentNumber {
        return new CommitmentNumber(this.value + 1n);
    }

    public toString() {
        return this.value.toString();
    }

    public toJSON() {
        return this.toString();
    }
}
