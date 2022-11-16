import { HashByteOrder, OutPoint } from "@node-lightning/bitcoin";

/**
 * ChannelId type that that encapsulates an outpoint as a 32-byte value
 * and is used to identify a channel. This type is defined in BOLT 2
 * under the peer protocol. It is defined as combining the funding_txid
 * and the funding_output_index, using big-endian XOR (meaning the
 * output_index modifies the last two bytes).
 */
export class ChannelId {
    /**
     * Constructs a `channel_id` from an outpoint by performing an XOR
     * of the output index against the last-two bytes of the bid-endian
     * txid.
     * @param outpoint
     * @returns
     */
    public static fromOutPoint(outpoint: OutPoint): ChannelId {
        if (outpoint.outputIndex > 0xffff) {
            throw new Error("Invalid channel_id outpoint");
        }

        const value = outpoint.txid.serialize(HashByteOrder.RPC);
        value[30] ^= outpoint.outputIndex >> 8;
        value[31] ^= outpoint.outputIndex & 0xff;
        return new ChannelId(value);
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
