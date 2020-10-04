import { shortChannelIdToNumber } from "./ShortChannelIdUtils";
import { shortChannelIdToBuffer } from "./ShortChannelIdUtils";
import { shortChannelIdToString } from "./ShortChannelIdUtils";

export class ShortChannelId {
    /**
     * Block height
     */
    public block: number;

    /**
     * Transaction index in the block
     */
    public txIdx: number;

    /**
     * Output index in transaction
     */
    public voutIdx: number;

    /**
     * Defined in Lightning BOLT 07. This object represents a fast way to look
     * up the funding transaction for a channel and consists of the block, the
     * index of a transaction in the block, and the index of an output in that
     * transaction.
     *
     * This object can take on several forms.
     */
    constructor(block: number, txIdx: number, voutIdx: number) {
        this.block = block;
        this.txIdx = txIdx;
        this.voutIdx = voutIdx;
    }

    /**
     * Converts the short_channel_id into a number
     */
    public toNumber(): bigint {
        return shortChannelIdToNumber(this);
    }

    /**
     * Converts the short_channel_id into a human
     * readable string in the format [block]x[txidx]x[voutidx]
     */
    public toString(): string {
        return shortChannelIdToString(this);
    }

    /**
     * Converts the short_chanenl_id into a buffer in the expected
     * serialization format.
     */
    public toBuffer(): Buffer {
        return shortChannelIdToBuffer(this);
    }
}
