const BufferCursor = require('@lntools/buffer-cursor');
const { isSegWitTx } = require('./is-segwit-tx');
const { decodeTxId } = require('./decode-tx-id');
const { decodeTxSize } = require('./decode-tx-size');

module.exports = { decodeTx };

/**
  Decodes a raw transaction from a buffer into a Tx object.
  This method will parse both legacy and SegWit transactions.

  @remarks
  Refer to: https://en.bitcoin.it/wiki/Protocol_documentation#tx

  @param {Buffer} raw raw transaction data
  @returns {import("./tx").Tx}
 */
function decodeTx(raw) {
  let cursor = new BufferCursor(raw);

  /**  @type {Array<import("./tx").TxIn>} */
  let vins = [];

  /**  @type {Array<import("./tx").TxOut>} */
  let vouts = [];

  // read version
  let version = cursor.readUInt32LE();

  // check for precesnse of witness marker and version flag
  let hasWitness = isSegWitTx(raw);

  // if we have witness, we need to read off the marker/flag now
  if (hasWitness) {
    cursor.readBytes(2);
  }

  // number of inputs
  let vinLen = cursor.readVarUint().toNumber(); // safe to convert

  for (let idx = 0; idx < vinLen; idx++) {
    // prev output hash
    let hash = cursor.readBytes(32);

    // prev output index
    let vout = cursor.readUInt32LE();

    // script sig length
    let scriptSigLen = cursor.readVarUint().toNumber(); // safe to convert

    // script sig
    let scriptSig = cursor.readBytes(scriptSigLen);

    // seqeuence
    let sequence = cursor.readUInt32LE();

    // add to inputs
    vins.push({
      txId: hash.reverse(),
      vout,
      scriptSig,
      sequence,
    });
  }

  // number of outputs
  let voutLen = cursor.readVarUint().toNumber(); // safe to convert

  // process each output
  for (let idx = 0; idx < voutLen; idx++) {
    // valid in sats
    let value = cursor.readUInt64LE();

    // pubkey/redeem script len
    let pubKeyScriptLen = cursor.readVarUint().toNumber(); // safe to convert

    // pubkeyScript/redeemScript
    let pubKeyScript = cursor.readBytes(pubKeyScriptLen);

    // add to outputs
    vouts.push({
      value,
      pubKeyScript,
    });
  }

  // process witness data
  if (hasWitness) {
    // for each input
    for (let i = 0; i < vinLen; i++) {
      // find how many witness components there are
      let witnessItems = cursor.readVarUint().toNumber(); // safe to convert

      // read each witness component
      vins[i].witness = [];
      for (let w = 0; w < witnessItems; w++) {
        // read the item length
        let itemLen = cursor.readVarUint().toNumber(); // safe to convert

        // read the item data
        let item = cursor.readBytes(itemLen);

        // add to witness stack
        vins[i].witness.push(item);
      }
    }
  }

  // finally attach the locktime
  let locktime = cursor.readUInt32LE();

  // decode the size
  let { size, vsize, weight } = decodeTxSize(raw);

  // decode the txId and hash
  let { txId, hash } = decodeTxId(raw);

  return {
    txId,
    hash,
    size,
    vsize,
    weight,
    version,
    vin: vins,
    vout: vouts,
    locktime,
  };
}
