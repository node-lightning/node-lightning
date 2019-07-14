// @ts-check

const { EventEmitter } = require('events');
const { decodeTx } = require('@lntools/bitcoin');
const { outpointKey } = require('./outpoint-util');

/**
 * @typedef {import("@lntools/bitcoind").BitcoindClient} BitcoindClient
 */

class TxWatcher extends EventEmitter {
  /**
   * TxWatcher listens for transactions that match certain patterns
   * and events when a transaction is found matching the pattern
   *
   * @param {BitcoindClient} client
   */
  constructor(client) {
    super();

    /**
     * @private
     * @type {BitcoindClient}
     */
    this._client = client;

    /**
     * Outpoints that are being watched
     * @type {Map<string, {txId:Buffer, output: number}>}
     */
    this.watchedOutpoints = new Map();
  }

  /**
   * Starts watching for transactions
   */
  start() {
    this._client.subscribeRawTx();
    this._client.on('rawtx', this._onRawTx.bind(this));
  }

  /**
   * Stops watching for transactions
   */
  stop() {
    // this._client.close();
  }

  /**
   * Watches an outpoint for broadcase in a new transaction
   * @param {{txId: Buffer, output: number}} outpoint
   */
  watchOutpoint(outpoint) {
    let key = outpointKey(outpoint);
    this.watchedOutpoints.set(key, outpoint);
  }

  ////////////////////////////////////////////////////////////////

  _onRawTx(buf) {
    let tx = decodeTx(buf);
    this.emit('tx', tx);
    this._checkOutpoints(tx);
  }

  _checkOutpoints(tx) {
    // check each
    for (let vin of tx.vin) {
      let key = outpointKey({ txId: vin.txId, output: vin.vout });
      let watchedOutpoint = this.watchedOutpoints.get(key);
      if (watchedOutpoint) {
        this.watchedOutpoints.delete(key);
        this.emit('outpointSpent', tx, watchedOutpoint);
      }
    }
  }
}

exports.TxWatcher = TxWatcher;
