const BufferCursor = require('@lntools/buffer-cursor');
const { isSegWitTx } = require('./is-segwit-tx');

module.exports = { decodeTxSize };

/**
  Decodes the size, virtual size, and weight properties from the raw
  transaction buffer.

  `size` is the number of raw bytes.
  `weight` is the number of witness bytes + the number of non-witness
    bytes multiplied by four.
  `vsize` is the weight divided by four.

  @param {Buffer} raw
  @returns {{
    size: Number,
    vsize: Number,
    weight: Number
  }}
 */
function decodeTxSize(raw) {
  let cursor = new BufferCursor(raw);
  let hasWitness = isSegWitTx(raw);

  let nwBytes = 0;
  let wBytes = 0;

  // version
  nwBytes += 4;
  cursor.position += 4;

  // witness flags
  if (hasWitness) {
    wBytes += 2;
    cursor.position += 2;
  }

  // number of inputs
  let vinLen = cursor.readVarUint().toNumber();
  nwBytes += cursor.lastReadBytes;

  for (let idx = 0; idx < vinLen; idx++) {
    // prev output hash
    cursor.position += 32;
    nwBytes += 32;

    // prev output index
    cursor.position += 4;
    nwBytes += 4;

    // script sig length
    let scriptSigLen = cursor.readVarUint().toNumber(); // safe to convert
    nwBytes += cursor.lastReadBytes;

    // script sig
    cursor.position += scriptSigLen;
    nwBytes += scriptSigLen;

    // seqeuence
    cursor.position += 4;
    nwBytes += 4;
  }

  // number of outputs
  let voutLen = cursor.readVarUint().toNumber(); // safe to convert
  nwBytes += cursor.lastReadBytes;

  // process each output
  for (let idx = 0; idx < voutLen; idx++) {
    // valid in sats
    cursor.position += 8;
    nwBytes += 8;

    // pubkey/redeem script len
    let pubKeyScriptLen = cursor.readVarUint().toNumber(); // safe to convert
    nwBytes += cursor.lastReadBytes;

    // pubkeyScript/redeemScript
    cursor.position += pubKeyScriptLen;
    nwBytes += pubKeyScriptLen;
  }

  // process witness data
  if (hasWitness) {
    // for each input
    for (let i = 0; i < vinLen; i++) {
      // find how many witness components there are
      let witnessItems = cursor.readVarUint().toNumber(); // safe to convert
      wBytes += cursor.lastReadBytes;

      // read each witness component
      for (let w = 0; w < witnessItems; w++) {
        // read the item length
        let itemLen = cursor.readVarUint().toNumber(); // safe to convert
        wBytes += cursor.lastReadBytes;

        // read the item data
        cursor.position += itemLen;
        wBytes += itemLen;
      }
    }
  }

  // locktime
  cursor.position += 4;
  nwBytes += 4;

  // size will be the raw length of bytes
  let size = raw.length;

  // weight is non-witness bytes * 4 + witness bytes
  let weight = nwBytes * 4 + wBytes;

  // virtual size is weight / 4
  // this is equivalent for non-segwit transactions
  let vsize = Math.ceil(weight / 4);

  return {
    size,
    vsize,
    weight,
  };
}
