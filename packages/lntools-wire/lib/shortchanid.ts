import BN from "bn.js";

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
  public toNumber(): BN {
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
export function shortChannelIdToNumber(obj: ShortChannelId): BN {
  const buf = shortChannelIdToBuffer(obj);
  return new BN(buf);
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
 * Returns the shortChannelId as a readable string in the format
 * "<block>x<tx_index>x<vout_index>"
 * @returns human readable string
 */
export function shortChannelIdToString(obj: ShortChannelId): string {
  const { block, txIdx, voutIdx } = obj;
  return `${block}x${txIdx}x${voutIdx}`;
}
