// @ts-check
const BufferCursor = require('@lntools/buffer-cursor');
const { sha256 } = require('@lntools/crypto');

module.exports = {
  decodeTx,
  decodeTxId,
  decodeTxSize,
  isSegWitTx,
  indexOfWitness,
};

/**
  Returns true is the raw transaction is a SegWit transition.
  This method works by reading the 5th and 6th bits. SegWit
  transitions have a 0x0001 as the flag for SegWit transactions.
  We can guarantee this because the next value is the tx_in
  count and can never be 0.

  @param {Buffer} raw
  @returns {boolean}
 */
function isSegWitTx(raw) {
  return raw[4] === 0x00 && raw[5] === 0x01;
}

/**
  Decodes the txId and hash from the Buffer.

  For non-segwit transitions, the hash value is the double-sha256 of
  version|vins|vouts|locktime. The txid is the reverse of the hash.

  For segwit transactions, the hash value is returned as the wtxid as
  calculated by the double-sha256 of
   version|0x00|0x01|inputs|outputs|witness|locktime. The txId is
  calculate the same as legacy transactions by performing a double
  sha256 hash of the data minus segwit data and markers.

  @param {Buffer} raw
  @returns {{
    txId: Buffer
    hash: Buffer
  }}
 */
function decodeTxId(raw) {
  let hash;
  let txId;
  if (isSegWitTx(raw)) {
    let witnessIdx = indexOfWitness(raw);
    let lhash = Buffer.alloc(raw.length - 2 - (raw.length - witnessIdx - 4));
    raw.copy(lhash, 0, 0, 4); // copy the version (2 bytes)
    raw.copy(lhash, 4, 6, witnessIdx); // copy inputs/outputs
    raw.copy(lhash, lhash.length - 4, raw.length - 4); // copy the locktime (4 bytes)

    let txidHash = sha256(sha256(lhash));
    txId = Buffer.alloc(txidHash.length, txidHash).reverse();
    hash = sha256(sha256(raw)).reverse();
  } else {
    let rawhash = sha256(sha256(raw));
    txId = Buffer.alloc(rawhash.length, rawhash).reverse();
    hash = Buffer.alloc(rawhash.length, rawhash).reverse();
  }
  return {
    txId,
    hash,
  };
}

/**
  Decodes the size, virtual size, and weight properties
  from the raw transaction buffer.

  size is the number of raw bytes.
  weight is the number of witness bytes + the number of non-witness
    bytes multiplied by four.
  vsize is the weight divided by four.

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
      hash,
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
