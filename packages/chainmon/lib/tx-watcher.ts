import { decodeTx } from "@lntools/bitcoin";
import { Tx } from "@lntools/bitcoin";
import { BitcoindClient } from "@lntools/bitcoind";
import { EventEmitter } from "events";
import { Outpoint } from "./outpoint";

export class TxWatcher extends EventEmitter {
    /**
     * Outpoints that are being watched
     */
    public watchedOutpoints: Map<string, Outpoint>;

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
        this.watchedOutpoints = new Map<string, Outpoint>();
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
    public watchOutpoint(outpoint: Outpoint) {
        const key = outpoint.toString();
        this.watchedOutpoints.set(key, outpoint);
    }

    ////////////////////////////////////////////////////////////////

    private _checkOutpoints(tx: Tx) {
        for (const vin of tx.vin) {
            const key = `${vin.txId.toString("hex")}:${vin.vout}`;
            const watchedOutpoint = this.watchedOutpoints.get(key);
            if (watchedOutpoint) {
                this.watchedOutpoints.delete(key);
                this.emit("outpointspent", tx, watchedOutpoint);
            }
        }
    }

    private _onRawTx(buf: Buffer) {
        const tx = decodeTx(buf);
        this.emit("tx", tx);
        this._checkOutpoints(tx);
    }
}

exports.TxWatcher = TxWatcher;
