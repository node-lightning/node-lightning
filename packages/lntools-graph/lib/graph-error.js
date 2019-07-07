// @ts-check

/** @enum {number} */
const ErrorCodes = {
  nodeAnnSigFailed: 1,
  chanAnnSigFailed: 2,
  chanUpdSigFailed: 3,
  chanBadBlockHash: 4,
  chanBadBlock: 5,
  chanAnnBadTx: 6,
  chanUtxoSpent: 7,
  chanBadScript: 8,
};

/** @enum {string} */
const ErrorCodeStrings = {
  1: 'node_ann_sig_failed',
  2: 'chan_ann_sig_failed',
  3: 'chan_upd_sig_failed',
  4: 'chan_bad_block_hash',
  5: 'chan_bad_block',
  6: 'chan_bad_tx',
  7: 'chan_utxo_spent',
  8: 'chan_bad_script',
};

class GraphError extends Error {
  /**
   * Creates an error for a graph operation and captures relevant that
   * caused the error to be emitted or thrown.
   *
   * @param {ErrorCodes} code
   * @param {Array<*>} data
   */
  constructor(code, data) {
    let msg = `${ErrorCodeStrings[code]}`;
    super(msg);

    this.area = 'graph';
    this.code = code;
    this.data = data;
  }
}

exports.ErrorCodes = ErrorCodes;
exports.GraphError = GraphError;
