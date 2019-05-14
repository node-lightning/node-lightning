const BufferCursor = require('@lntools/buffer-cursor');
const { isSegWitTx } = require('./is-segwit-tx');

module.exports = { indexOfWitness };

/**
  Finds the index of the witness data in the raw Buffer.
  Returns -1 if the transition does not have witness data.

  @remarks
  This method will parse the Buffer to obtain the witness
  data location.

  @param {Buffer} raw
  @returns {number} index of the witness data
 */
function indexOfWitness(raw) {
  if (!isSegWitTx(raw)) return -1;

  let cursor = new BufferCursor(raw);
  cursor.readUInt32LE(); // version
  cursor.readBytes(2); // marker and version
  let vinLen = cursor.readVarUint().toNumber(); // safe to convert
  for (let idx = 0; idx < vinLen; idx++) {
    cursor.readBytes(32); // prev output hash
    cursor.readUInt32LE(); // prev output index
    let scriptSigLen = cursor.readVarUint().toNumber(); // safe to convert
    cursor.readBytes(scriptSigLen); // script sig
    cursor.readUInt32LE(); // sequence
  }
  let voutLen = cursor.readVarUint().toNumber(); // safe to convert
  for (let idx = 0; idx < voutLen; idx++) {
    cursor.readUInt64LE(); // sats
    let pubKeyScriptLen = cursor.readVarUint().toNumber(); // safe to convert
    cursor.readBytes(pubKeyScriptLen); // pubkeyScript/redeemScript
  }
  return cursor.position;
}
