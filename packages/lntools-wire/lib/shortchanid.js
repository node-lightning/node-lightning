const BN = require('bn.js');

module.exports = {
  shortChannelIdNumber,
  shortChannelIdObj,
  shortChannelIdString,
};

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
