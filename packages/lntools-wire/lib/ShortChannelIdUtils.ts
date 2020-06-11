import { ShortChannelId } from "./ShortChannelId";

/**
 * Converts the shortChannelId object into a buffer
 */
export function shortChannelIdToBuffer(obj: ShortChannelId): Buffer {
    if (!obj) return Buffer.alloc(8);
    const buf = Buffer.alloc(8);
    buf.writeUIntBE(obj.block, 0, 3);
    buf.writeUIntBE(obj.txIdx, 3, 3);
    buf.writeUIntBE(obj.voutIdx, 6, 2);
    return buf;
}

/**
 * Returns the short_channel_id as a BigNumber object that can be
 * easily converted into a base10 string.
 */
export function shortChannelIdToNumber(obj: ShortChannelId): bigint {
    const buf = shortChannelIdToBuffer(obj);
    return BigInt("0x" + buf.toString("hex"));
}

/**
 * Creates a ShortChannelId from a string matching the pattern
 * [block]x[txIdx]x[voutIdx].
 */
export function shortChannelIdFromString(text: string): ShortChannelId {
    const match = text.match(/(\d+?)x(\d+?)x(\d+?)/);
    if (!match) {
        throw new Error("invalid shortChannelId string");
    }
    const block = parseInt(match[1]);
    const txIdx = parseInt(match[2]);
    const voutIdx = parseInt(match[3]);
    return new ShortChannelId(block, txIdx, voutIdx);
}

/**
 * Creates a ShortChannelId from a buffer.
 */
export function shortChannelIdFromBuffer(buf: Buffer): ShortChannelId {
    if (!Buffer.isBuffer(buf) || buf.length !== 8) {
        throw new Error("invalid argument");
    }
    const block = buf.readUIntBE(0, 3);
    const txIdx = buf.readUIntBE(3, 3);
    const voutIdx = buf.readUIntBE(6, 2);
    return new ShortChannelId(block, txIdx, voutIdx);
}

/**
 * Creates a ShortChannelId from a number.
 */
export function shortChannelIdFromNumber(num: bigint): ShortChannelId {
    const block = (num & BigInt(0xffffff0000000000)) >> BigInt(40);
    const txIdx = (num & BigInt(0xffffff0000)) >> BigInt(16);
    const voutIdx = num & BigInt(0xffff);
    return new ShortChannelId(Number(block), Number(txIdx), Number(voutIdx));
}

/**
 * Returns the shortChannelId as a readable string in the format
 * "<block>x<tx_index>x<vout_index>"
 * @returns human readable string
 */
export function shortChannelIdToString(obj: ShortChannelId): string {
    const { block, txIdx, voutIdx } = obj;
    return `${block}x${txIdx}x${voutIdx}`;
}
