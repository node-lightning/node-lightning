class OutPoint {
  /**
   * OutPoint
   * @param {string} txId
   * @param {number} voutIdx
   */
  constructor(txId, voutIdx) {
    /**
     * Transaction ID
     * @type {string}
     */
    this.txId = txId;

    /**
     * Index of output in transaction
     * @type {number}
     */
    this.voutIdx = voutIdx;
  }

  /**
   * Converts the outpoint to a human readable string
   * where in the format [txid]:[voutidx]
   * @returns {string}
   */
  toString() {
    return outpointToString(this);
  }
}

exports.OutPoint = OutPoint;
exports.outpointToString = outpointToString;

/**
 * Converts an outpoint to a readable string
 * @param {OutPoint} o
 */
function outpointToString(o) {
  return `${o.txId}:${o.voutIdx}`;
}
