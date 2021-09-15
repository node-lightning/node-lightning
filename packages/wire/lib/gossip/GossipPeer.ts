import { ILogger } from "@node-lightning/logger";
import { Readable } from "stream";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";
import { IWireMessage } from "../messages/IWireMessage";
import { MessageType } from "../MessageType";
import { IPeer, Peer } from "../Peer";
import { PeerState } from "../PeerState";
import { GossipError, GossipErrorCode } from "./GossipError";
import { GossipFilter } from "./GossipFilter";
import { GossipQueriesReceiver } from "./GossipQueriesReceiver";
import { GossipQueriesSync } from "./GossipQueriesSync";

export enum ReadState {
    Ready,
    Reading,
    Blocked,
}

/**
 * Implements a decorator for the standard Peer adding functionality for Gossip
 * related activities. Messages from the GossipPeer occur after being pushed
 * through a GossipFilter to validate they are aokay.
 */
export class GossipPeer extends Readable implements IPeer {
    public readonly logger: ILogger;

    private _readState: ReadState = ReadState.Ready;
    private _receiver: GossipQueriesReceiver;
    private _syncRangeTask: GossipQueriesSync;

    /**
     * This class expects to be instantiated by a peer that is read and will
     * throw if the peer is not yet in the ready state. This ensures we can
     * construct the GossipPeer correctly using the negotiated features
     * @param peer
     * @param filter
     * @param logger
     */
    constructor(readonly peer: Peer, readonly filter: GossipFilter, logger: ILogger) {
        super({ objectMode: true, highWaterMark: peer.highWaterMark });

        // Enforce that the peer is ready to rock
        if (peer.state !== PeerState.Ready) {
            throw new GossipError(GossipErrorCode.PeerNotReady);
        }

        // Construct a sub-logger for use by the Gossiping systems
        this.logger = logger.sub("gspeer", peer.id);

        // Attach the appropriate events, many of them will simply be forwarded
        // but we will intercept messages and funnel appropriate messages
        // through the filter.
        this.peer.on("readable", this._onPeerReadable.bind(this));
        this.peer.on("close", () => this.emit("close"));
        if (this.gossipQueries) {
            this._receiver = new GossipQueriesReceiver(
                this.peer.localFeatures[0],
                this.peer,
                this.logger,
            );
        }
    }

    /**
     * Returns true if the gossip_queries feature has been negotiated with the
     * remote peer.
     */
    public get gossipQueries(): boolean {
        return (
            this.peer.remoteFeatures.isSet(InitFeatureFlags.gossipQueriesOptional) ||
            this.peer.remoteFeatures.isSet(InitFeatureFlags.gossipQueriesRequired)
        );
    }

    /**
     * Performs Gossip synchronization using the negotiated strategy. Currently
     * only support gossip_queries
     * @param firstBlock
     * @param numBlocks
     */
    public async syncRange(firstBlock?: number, numBlocks?: number): Promise<boolean> {
        if (this.gossipQueries) {
            const chainHash = this.peer.localChains[0];
            this._syncRangeTask = new GossipQueriesSync(chainHash, this, this.logger);
            await this._syncRangeTask.queryRange(firstBlock, numBlocks);
            this._syncRangeTask = undefined;
            return true;
        }
        return false;
    }

    /**
     * Enables the receipt of rumor mongered messages.
     */
    public enableGossip() {
        if (this.gossipQueries) {
            this._receiver.activate();
        }
    }

    /**
     * Disables the receipt of rumor mongered messages.
     */
    public disableGossip() {
        if (this.gossipQueries) {
            this._receiver.deactivate();
        }
    }

    /**
     * Sends the serialized data to the peer.
     * @param buf
     */
    public send(buf: Buffer) {
        this.peer.send(buf);
    }

    /**
     * Sends a message to the peer using the default serialization.
     * @param msg
     */
    public sendMessage(msg: IWireMessage) {
        this.peer.sendMessage(msg);
    }

    /**
     * Disconnects the peer
     */
    public disconnect() {
        this.peer.disconnect();
    }

    /**
     * Fires when a peer triggers the readable event. This method locks
     * to ensure only a single read event occurs at a time.
     * @returns
     */
    protected async _onPeerReadable() {
        while (this._readState === ReadState.Ready) {
            this._readState = ReadState.Reading;
            const msg = this.peer.read() as IWireMessage;
            if (!msg) {
                this._readState = ReadState.Ready;
                return;
            }

            const filteredMsgs = await this._onPeerMessage(msg);
            this._readState = ReadState.Ready;

            for (const filteredMsg of filteredMsgs) {
                if (!this.push(filteredMsg)) {
                    this._readState = ReadState.Blocked;
                }
            }
        }
    }

    /**
     * Internally process messages. If the message is a routing related message
     * it will pass through the GossipFilter, otherwise it will be immediately
     * broadcast.
     * @param msg
     */
    protected async _onPeerMessage(msg: IWireMessage): Promise<IWireMessage[]> {
        // HACK: we're adding the sync task message tracking here
        if (this._syncRangeTask) {
            this._syncRangeTask.handleWireMessage(msg);
        }

        // Run gossip message through the filter
        if (
            msg.type === MessageType.ChannelAnnouncement ||
            msg.type === MessageType.ChannelUpdate ||
            msg.type === MessageType.NodeAnnouncement
        ) {
            try {
                const result = await this.filter.validateMessage(msg);

                if (result.isOk) {
                    return result.value;
                } else {
                    // Handled error should be emitted to the caller
                    // but we prevent the transform stream from
                    // stopping by calling the callback without an
                    // error.
                    this.emit("gossip_error", result.error);
                }

                // Unhandled error is something unexpected and our peer
                // is now in a broken state and we need to disconnect.
            } catch (err) {
                this.disconnect();
                this.emit("error", err);
                return [];
            }
        }
        return [msg];
    }

    public _read() {
        // This method will be triggered when .read() is called by the
        // consumer. Therefore we can consider the read unblocked.
        if (this._readState === ReadState.Blocked) {
            this._readState = ReadState.Ready;
        }
        // Trigger a read but wait until the end of the event loop.
        // This is necessary when reading in paused mode where
        // _read was triggered by stream.read() originating inside
        // a "readable" event handler. Attempting to push more data
        // synchronously will not trigger another "readable" event.
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setImmediate(() => this._onPeerReadable());
    }
}
