import { HashByteOrder, OutPoint } from "@node-lightning/bitcoin";

/**
 * The `channel_id`, defined in [BOLT #2](https://github.com/lightningnetwork/lightning-rfc/blob/master/02-peer-protocol.md#definition-of-channel_id),
 * is a 32-byte identifer for a channel that is based on the channel's
 * outpoint. This identifier is used by some messages to identify the
 * channel instead of the `short_channel_id`.  The `channel_id` is
 * derived from the XOR of the big-endiant representation of the
 * `funding_txid` and the `funding_output_index`.
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
     * Returns true if the `channel_id`s are equal.
     * @param other
     * @returns
     */
    public equals(other: ChannelId): boolean {
        return this.value.equals(other.value);
    }

    /**
     * Serializes to the hex representation of the `channel_id`
     */
    public toString(): string {
        return this.value.toString("hex");
    }

    /**
     * Serializes to a buffer
     * @returns
     */
    public toBuffer(): Buffer {
        return Buffer.from(this.value);
    }
}
