import { HashByteOrder, OutPoint } from "@node-lightning/bitcoin";

/**
 * ChannelId type that that encapsulates an outpoint as a 32-byte value
 * and is used to identify a channel. This type is defined in BOLT 2
 * under the peer protocol. It is defined as combinging the funding_txid
 * and the funding_output_index, using big-endian XOR (meaning the
 * output_index modifies the last two bytes).
 */
export class ChannelId {
    public static fromOutPoint(outpoint: OutPoint): ChannelId {
        const txid = outpoint.txid.serialize(HashByteOrder.RPC);

        if (outpoint.outputIndex > 0xffff) {
            throw new Error("Invalid output index length");
        }

        txid[30] ^= outpoint.outputIndex >> 8;
        txid[31] ^= outpoint.outputIndex & 0xff;

        return new ChannelId(txid);
    }

    constructor(readonly value: Buffer) {}

    /**
     * Converts the ChannelId into a buffer
     */
    public toBuffer(): Buffer {
        return Buffer.from(this.value);
    }

    /**
     * Converts the ChannelId into a hex-encoded string
     */
    public toString(): string {
        return this.toHex();
    }

    /**
     * Converts the ChannelId to a hex-encoded string
     */
    public toHex(): string {
        return this.value.toString("hex");
    }

    /**
     * Returns true if the ChannelIds are byte-wise equal
     * @param other
     */
    public equals(other: ChannelId): boolean {
        return this.value.equals(other.value);
    }
}
