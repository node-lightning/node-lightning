import { ILogger } from "@node-lightning/logger";
import { ChannelAnnouncementMessage } from "../messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "../messages/ChannelUpdateMessage";
import { IWireMessage } from "../messages/IWireMessage";
import { NodeAnnouncementMessage } from "../messages/NodeAnnouncementMessage";
import { MessageType } from "../MessageType";

export enum GossipSyncWatcherState {
    Idle,
    Watching,
    Complete,
    Canceled,
}

/**
 * GossipSyncWatcher monitors the progress of a GossipSync operation for the
 * completion of the synchronization and signals once the sync has completed
 * or timed out.
 */
export class GossipSyncWatcher {
    public completeAfterMs = 5000;

    private _state: GossipSyncWatcherState;
    private _timeoutHandle: NodeJS.Timeout;
    private _messageCounter: number;

    private _resolve: (value: void) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _reject: (reason: any) => void;

    constructor(readonly logger: ILogger) {
        this._state = GossipSyncWatcherState.Idle;
        this._messageCounter = 0;
        this._onTimeout = this._onTimeout.bind(this);
    }

    /**
     * Gets the state of the Watcher: IDLE, WATCHING, COMPLETE, FAILED
     */
    public get state(): GossipSyncWatcherState {
        return this._state;
    }

    /**
     * Gets the number of messages that have been seen while watching
     */
    public get messageCounter(): number {
        return this._messageCounter;
    }

    /**
     * Watches gossip traffic until a completion event occurs or watching is
     * cancelled.
     */
    public watch(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._state = GossipSyncWatcherState.Watching;
            this._setTimeout();
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    /**
     * Process a message and debounce when it is a gossip message
     * @param msg
     */
    public onGossipMessage(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        msg: ChannelAnnouncementMessage | ChannelUpdateMessage | NodeAnnouncementMessage,
    ): void {
        this._messageCounter += 1;
        this._clearTimeout();
        this._setTimeout();
    }

    /**
     * Cancels watching and sends a failure signal.
     */
    public cancel(): void {
        this._clearTimeout();

        this._state = GossipSyncWatcherState.Canceled;
        this._resolve();
    }

    private _clearTimeout() {
        clearTimeout(this._timeoutHandle);
    }

    private _setTimeout() {
        this._timeoutHandle = setTimeout(this._onTimeout, this.completeAfterMs);
    }

    private _onTimeout() {
        this._state = GossipSyncWatcherState.Complete;
        this._resolve();
    }
}
