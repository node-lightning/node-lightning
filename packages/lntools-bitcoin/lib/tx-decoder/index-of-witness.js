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
  cursor.position += 4; // version
  cursor.position += 2; // segwit marker and version

  let vinLen = cursor.readVarUint().toNumber(); // number of inputs
  for (let idx = 0; idx < vinLen; idx++) {
    cursor.position += 32; // prev output hash
    cursor.position += 4; // prev output index

    let scriptSigLen = cursor.readVarUint().toNumber(); // script sig length
    cursor.position += scriptSigLen; // script sig
    cursor.position += 4; // sequence
  }

  let voutLen = cursor.readVarUint().toNumber(); // number of outputs
  for (let idx = 0; idx < voutLen; idx++) {
    cursor.position += 8; // sats

    let pubKeyScriptLen = cursor.readVarUint().toNumber(); // pubkeyscript length
    cursor.position += pubKeyScriptLen; // pubkeyScript/redeemScript
  }
  return cursor.position;
}
