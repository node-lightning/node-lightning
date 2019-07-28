// @ts-check

const { OutPoint } = require('../outpoint');

exports.outpointFromString = outpointFromString;

/**
 * Converts a string in the format [txid]:[voutidx] into
 * an OutPoint object
 * @param {string} text
 * @returns {OutPoint}
 */
function outpointFromString(text) {
  let parts = text.match(/([0-9a-f]{64,64}):(\d+)/i);
  if (!parts) {
    throw new Error('invalid argument');
  }
  let txId = parts[1];
  let voutIdx = parseInt(parts[2]);
  if (voutIdx < 0) {
    throw new Error('invalid argument');
  }
  return new OutPoint(txId, voutIdx);
}
