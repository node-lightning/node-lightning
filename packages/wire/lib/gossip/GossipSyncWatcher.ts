import { ILogger } from "@node-lightning/logger";
import { EventEmitter } from "events";
import { IWireMessage } from "../messages/IWireMessage";
import { GossipError, GossipErrorCode } from "./GossipError";
import { GossipPeer } from "./GossipPeer";

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
    private _emitter: EventEmitter;
    private _timeoutHandle: NodeJS.Timeout;
    private _messageCounter: number;

    constructor(readonly peer: GossipPeer, readonly logger: ILogger) {
        this._emitter = new EventEmitter();
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
            this._subMessages();
            this._setTimeout();
            this._emitter.once("complete", resolve);
            this._emitter.once("error", reject);
        });
    }

    /**
     * Cancels watching and sends a failure signal.
     */
    public cancel() {
        this._unsubMessages();
        this._clearTimeout();

        this._state = GossipSyncWatcherState.Canceled;
        this._emitter.emit("complete");
    }

    private _subMessages() {
        this.peer.on("message", this._onMessage.bind(this));
    }

    private _unsubMessages() {
        this.peer.off("message", this._onMessage.bind(this));
    }

    private _onMessage(msg: IWireMessage) {
        this._messageCounter += 1;
        this._clearTimeout();
        this._setTimeout();
    }

    private _clearTimeout() {
        clearTimeout(this._timeoutHandle);
    }

    private _setTimeout() {
        this._timeoutHandle = setTimeout(this._onTimeout, this.completeAfterMs);
    }

    private _onTimeout() {
        this._unsubMessages();
        this._state = GossipSyncWatcherState.Complete;
        this._emitter.emit("complete");
    }
}
