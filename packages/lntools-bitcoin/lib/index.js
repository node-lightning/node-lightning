const { decodeTx } = require('./tx-decoder/decode-tx');
const { decodeTxId } = require('./tx-decoder/decode-tx-id');
const { decodeTxSize } = require('./tx-decoder/decode-tx-size');
const { isSegWitTx } = require('./tx-decoder/is-segwit-tx');
const { indexOfWitness } = require('./tx-decoder/index-of-witness');

exports.decodeTx = decodeTx;
exports.decodeTxId = decodeTxId;
exports.decodeTxSize = decodeTxSize;
exports.isSegwitTx = isSegWitTx;
exports.indexOfWitness = indexOfWitness;
