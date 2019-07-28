// @ts-check

const BN = require('bn.js');

module.exports = {
  shortChannelIdBuffer,
  shortChannelIdNumber,
  shortChannelIdObj,
  shortChannelIdString,
};

/**
 * Converts the shortChannelId object into a buffer
 * @param {{ block: number, txIdx: number, voutIdx: number }} obj
 * @returns {Buffer}
 */
function shortChannelIdBuffer(obj) {
  if (!obj) return Buffer.alloc(8);
  let buf = Buffer.alloc(8);
  buf.writeUIntBE(obj.block, 0, 3);
  buf.writeUIntBE(obj.txIdx, 3, 3);
  buf.writeUIntBE(obj.voutIdx, 6, 2);
  return buf;
}

/**
  Returns the shortChannelId as a base 10 number string.
  @param {Buffer} buf
  @returns {string}
 */
function shortChannelIdNumber(buf) {
  return new BN(buf).toString(10);
}

/**
 * Returns the shortChannelId as an object containing
 * the block number, transaction index and vout index. The string
 * input should be the shortChannelId string format.
 * @param {Buffer|string} arg
 * @returns {{ block: number, txIdx: number, voutIdx: number }}
 */
function shortChannelIdObj(arg) {
  if (Buffer.isBuffer(arg)) {
    return _objectFromBuffer(arg);
  } else if (typeof arg === 'string') {
    return _objectFromString(arg);
  } else {
    throw new Error('Invalid argument type');
  }
}

/**
  Returns the shortChannelId as a readable string in the format
  "<block>x<tx_index>x<vout_index>"
  @param {Buffer} buf
  @returns {string} human readable string
 */
function shortChannelIdString(buf) {
  let { block, txIdx, voutIdx } = shortChannelIdObj(buf);
  return `${block}x${txIdx}x${voutIdx}`;
}

///////////////////////////////////////////////////////////////

/**
 * @private
 * @param {Buffer} buf
 * @returns {{ block: number, txIdx: number, voutIdx: number }}
 */
function _objectFromBuffer(buf) {
  return {
    block: buf.readUIntBE(0, 3),
    txIdx: buf.readUIntBE(3, 3),
    voutIdx: buf.readUIntBE(6, 2),
  };
}

/**
 * @private
 * @param {string} text
 * @returns {{ block:number, txIdx:number, voutIdx: number }}
 */
function _objectFromString(text) {
  let match = text.match(/(\d+?)x(\d+?)x(\d+?)/);
  if (!match) {
    throw new Error('invalid shortChannelId string');
  }
  let block = parseInt(match[1]);
  let txIdx = parseInt(match[2]);
  let voutIdx = parseInt(match[3]);
  return {
    block,
    txIdx,
    voutIdx,
  };
}
