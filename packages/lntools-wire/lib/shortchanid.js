const BN = require('bn.js');

module.exports = {
  shortChannelIdBuffer,
  shortChannelIdNumber,
  shortChannelIdObj,
  shortChannelIdString,
};

/**
  Converts the shortChannelId object into a buffer
  @param {{
    block: number
    txIdx: number
    voutIdx: number
  }}
  @returns {string}
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
  Returns the shortChannelId as an object containing
  the block number, transaction index and vout index.
  @param {Buffer} buf
  @returns {{
    block: number
    txIdx: number
    voutIdx: number
  }}
 */
function shortChannelIdObj(buf) {
  return {
    block: buf.readUIntBE(0, 3),
    txIdx: buf.readUIntBE(3, 3),
    voutIdx: buf.readUIntBE(6, 2),
  };
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
