import { BitcoindClient, BlockSummary } from "@node-lightning/bitcoind";
import { BlockHeader } from "@node-lightning/bitcoind";
import { BlockDiffer } from "./BlockDiffer";
import { ILogger } from "@node-lightning/logger";
import { EventEmitter } from "events";

export type BlockWatcherFn = (block: BlockSummary) => Promise<void>;

/**
 * This class polls for blocks from a bitcoind instance and fires a
 * unicast handler for block connection and disconnection. Upon initial
 * start-up the chain is synced based on the last known block.
 * When a new block is discovered a reorganization check is performed. If
 * a reorganization has happened, then blocks are disconnected until a
 * common ancestor has been found and reconnected to get to the best
 * block tip.
 */
export class BlockWatcher extends EventEmitter {
    public lastHeader: BlockHeader;
    public blockDiffer: BlockDiffer;
    public syncing: boolean;

    protected _handle: NodeJS.Timeout;

    constructor(
        readonly client: BitcoindClient,
        lastHeader: BlockHeader,
        readonly onConnect: BlockWatcherFn,
        readonly onDisconnect: BlockWatcherFn,
        readonly pollIntervalMs: number = 5000,
        readonly logger?: ILogger,
    ) {
        super();
        this.lastHeader = lastHeader;
        this.blockDiffer = new BlockDiffer(client);
    }

    public start(): void {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._onPoll();
    }

    public stop(): void {
        this._clear();
    }

    protected _clear() {
        clearTimeout(this._handle);
    }

    protected _scheduleNext() {
        this._clear();

        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        this._handle = setTimeout(this._onPoll.bind(this), this.pollIntervalMs);
    }

    protected async _onPoll() {
        try {
            await this._sync();
        } catch (ex) {
            this.emit("error", ex);
        }
        this._scheduleNext();
    }

    protected async _sync() {
        if (this.syncing) return;

        this.syncing = true;
        const bestHash = await this.client.getBestBlockHash();
        const bestHeader = await this.client.getHeader(bestHash);
        const lastHeader = this.lastHeader;

        const diff = await this.blockDiffer.diff(bestHeader, lastHeader);

        for (const header of diff.disconnects) {
            await this._disconnectBlock(header);
        }

        for (const header of diff.connects) {
            await this._connectBlock(header);
        }

        this.syncing = false;
    }

    protected async _connectBlock(header: BlockHeader) {
        if (this.logger) this.logger.debug("connecting block", header.height, header.hash);
        const block = await this.client.getBlock(header.hash);
        await this.onConnect(block);
        this.lastHeader = header;
    }

    protected async _disconnectBlock(header: BlockHeader) {
        if (this.logger) this.logger.debug("disconnecting block", header.height, header.hash);
        const block = await this.client.getBlock(header.hash);
        await this.onDisconnect(block);
    }
}
