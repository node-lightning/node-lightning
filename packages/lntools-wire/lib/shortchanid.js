// @ts-check

const BN = require('bn.js');

class ShortChannelId {
  /**
   * Defined in Lightning BOLT 07. This object represents a fast way to look
   * up the funding transaction for a channel and consists of the block, the
   * index of a transaction in the block, and the index of an output in that
   * transaction.
   *
   * This object can take on several forms.
   *
   * @param {number} block
   * @param {number} txIdx
   * @param {number} voutIdx
   */
  constructor(block, txIdx, voutIdx) {
    /**
     * Block height
     * @type {number}
     */
    this.block = block;

    /**
     * Transaction index in the block
     * @type {number}
     */
    this.txIdx = txIdx;

    /**
     * Output index in transaction
     * @type {number}
     */
    this.voutIdx = voutIdx;
  }

  /**
   * Converts the short_channel_id into a number
   * @returns {BN}
   */
  toNumber() {
    return shortChannelIdToNumber(this);
  }

  /**
   * Converts the short_channel_id into a human
   * readable string in the format [block]x[txidx]x[voutidx]
   * @returns {string}
   */
  toString() {
    return shortChannelIdToString(this);
  }

  /**
   * Converts the short_chanenl_id into a buffer in the expected
   * serialization format.
   * @returns {Buffer}
   */
  toBuffer() {
    return shortChannelIdToBuffer(this);
  }
}

exports.ShortChannelId = ShortChannelId;
exports.shortChannelIdToBuffer = shortChannelIdToBuffer;
exports.shortChannelIdToNumber = shortChannelIdToNumber;
exports.shortChannelIdToString = shortChannelIdToString;
exports.shortChannelIdFromString = shortChannelIdFromString;
exports.shortChannelIdFromBuffer = shortChannelIdFromBuffer;

/**
 * Converts the shortChannelId object into a buffer
 * @param {ShortChannelId} obj
 * @returns {Buffer}
 */
function shortChannelIdToBuffer(obj) {
  if (!obj) return Buffer.alloc(8);
  let buf = Buffer.alloc(8);
  buf.writeUIntBE(obj.block, 0, 3);
  buf.writeUIntBE(obj.txIdx, 3, 3);
  buf.writeUIntBE(obj.voutIdx, 6, 2);
  return buf;
}

/**
 * Returns the short_channel_id as a BigNumber object that can be
 * easily converted into a base10 string.
 * @param {ShortChannelId} obj
 * @returns {BN}
 */
function shortChannelIdToNumber(obj) {
  let buf = shortChannelIdToBuffer(obj);
  return new BN(buf);
}

/**
 * Creates a ShortChannelId from a string matching the pattern
 * [block]x[txIdx]x[voutIdx].
 * @param {string} text
 * @returns {ShortChannelId}
 */
function shortChannelIdFromString(text) {
  let match = text.match(/(\d+?)x(\d+?)x(\d+?)/);
  if (!match) {
    throw new Error('invalid shortChannelId string');
  }
  let block = parseInt(match[1]);
  let txIdx = parseInt(match[2]);
  let voutIdx = parseInt(match[3]);
  return new ShortChannelId(block, txIdx, voutIdx);
}

/**
 * Creates a ShortChannelId from a buffer.
 * @param {Buffer} buf
 * @returns {ShortChannelId}
 */
function shortChannelIdFromBuffer(buf) {
  if (!Buffer.isBuffer(buf) || buf.length !== 8) {
    throw new Error('invalid argument');
  }
  let block = buf.readUIntBE(0, 3);
  let txIdx = buf.readUIntBE(3, 3);
  let voutIdx = buf.readUIntBE(6, 2);
  return new ShortChannelId(block, txIdx, voutIdx);
}

/**
  Returns the shortChannelId as a readable string in the format
  "<block>x<tx_index>x<vout_index>"
  @param {ShortChannelId} obj
  @returns {string} human readable string
 */
function shortChannelIdToString(obj) {
  let { block, txIdx, voutIdx } = obj;
  return `${block}x${txIdx}x${voutIdx}`;
}
