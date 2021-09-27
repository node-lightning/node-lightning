import { OutPoint, Tx } from "@node-lightning/bitcoin";
import { BitcoindClient } from "@node-lightning/bitcoind";
import { EventEmitter } from "events";

export class TxWatcher extends EventEmitter {
    /**
     * Outpoints that are being watched
     */
    public watchedOutPoints: Map<string, OutPoint>;

    private _client: BitcoindClient;

    /**
     * TxWatcher listens for transactions that match certain patterns
     * and events when a transaction is found matching the pattern
     *
     * @param client
     */
    constructor(client: BitcoindClient) {
        super();
        this._client = client;
        this.watchedOutPoints = new Map<string, OutPoint>();
    }

    /**
     * Starts watching for transactions
     */
    public start() {
        this._client.subscribeRawTx();
        this._client.on("rawtx", this._onRawTx.bind(this));
    }

    /**
     * Stops watching for transactions
     */
    public stop() {
        // this._client.close();
    }

    /**
     * Watches an outpoint for broadcase in a new transaction
     * @param outpoint
     */
    public watchOutpoint(outpoint: OutPoint) {
        const key = outpoint.toString();
        this.watchedOutPoints.set(key, outpoint);
    }

    ////////////////////////////////////////////////////////////////

    private _checkOutpoints(tx: Tx) {
        for (const vin of tx.inputs) {
            const key = vin.outpoint.toString();
            const watchedOutpoint = this.watchedOutPoints.get(key);
            if (watchedOutpoint) {
                this.watchedOutPoints.delete(key);
                this.emit("outpointspent", tx, watchedOutpoint);
            }
        }
    }

    private _onRawTx(buf: Buffer) {
        let tx: Tx;
        try {
            tx = Tx.fromBuffer(buf);
        } catch (ex) {
            this.emit("error", ex, buf);
            return;
        }
        this.emit("tx", tx);
        this._checkOutpoints(tx);
    }
}
