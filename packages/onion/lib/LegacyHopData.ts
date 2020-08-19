import { ShortChannelId } from "@node-lightning/wire";
import { shortChannelIdFromBuffer } from "@node-lightning/wire";

/**
 *
 */
export class LegacyHopData {
    public static parse(buffer: Buffer) {
        const scid = shortChannelIdFromBuffer(buffer.slice(0, 8));
        const amount = BigInt("0x" + buffer.slice(8, 16).toString("hex"));
        const cltvValue = buffer.readUInt32BE(16);
        const padding = buffer.slice(20);
        return new LegacyHopData(scid, amount, cltvValue, padding);
    }

    constructor(
        /**
         * The ID of the outgoing channel used to route the message
         */
        readonly scid: ShortChannelId,

        /**
         * Amount in millisatoshi to forward to the next receiving peer
         */
        readonly amountToForward: bigint,

        /**
         *
         */
        readonly cltvValue: number,

        /**
         *
         */
        readonly padding: Buffer,
    ) {}

    public toBuffer() {
        //
    }
}
