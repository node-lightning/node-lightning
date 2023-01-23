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
    public knownHash: string;
    public blockDiffer: BlockDiffer;
    public syncing: boolean;

    protected _handle: NodeJS.Timeout;

    constructor(
        readonly client: BitcoindClient,
        knownHash: string,
        readonly onConnect: BlockWatcherFn,
        readonly onDisconnect: BlockWatcherFn,
        readonly logger?: ILogger,
        readonly pollIntervalMs: number = 5000,
    ) {
        super();
        this.knownHash = knownHash;
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

        // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-argument
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

        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (bestHash === this.knownHash) break;

            const knownHeader = await this.client.getHeader(this.knownHash);

            // Orphaned blocks will have -1 confirmations. We will
            // disconnect this block and the last known block will be
            // the previous block's hash.
            if (knownHeader.confirmations < 0) {
                await this._disconnectBlock(knownHeader);
                this.knownHash = knownHeader.previousblockhash;
                continue;
            }

            // If the current knwon header has a next block, we will
            // connect it and establish the next block as the new
            // known block.
            if (knownHeader.nextblockhash) {
                const nextHeader = await this.client.getHeader(knownHeader.nextblockhash);
                await this._connectBlock(nextHeader);
                this.knownHash = nextHeader.hash;
                continue;
            }
        }

        this.syncing = false;
    }

    protected async _connectBlock(header: BlockHeader) {
        if (this.logger) this.logger.debug("connecting block", header.height, header.hash);
        const block = await this.client.getBlockSummary(header.hash);
        await this.onConnect(block);
    }

    protected async _disconnectBlock(header: BlockHeader) {
        if (this.logger) this.logger.debug("disconnecting block", header.height, header.hash);
        const block = await this.client.getBlockSummary(header.hash);
        await this.onDisconnect(block);
    }
}
