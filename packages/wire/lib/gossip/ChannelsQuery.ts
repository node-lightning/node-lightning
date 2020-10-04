import { ShortChannelId } from "@node-lightning/core";
import { ILogger } from "@node-lightning/logger";
import { EventEmitter } from "events";
import { IWireMessage } from "../messages/IWireMessage";
import { QueryShortChannelIdsMessage } from "../messages/QueryShortChannelIdsMessage";
import { ReplyShortChannelIdsEndMessage } from "../messages/ReplyShortChannelIdsEndMessage";
import { IMessageSenderReceiver } from "../Peer";
import { GossipError, GossipErrorCode } from "./GossipError";

export enum ChannelsQueryState {
    Idle,
    Active,
    Complete,
    Failed,
}

/**
 * This class manages the state machine for executing query_short_channel_ids
 * and will resolve as either complete or with an error. This class can accept
 * an arbitrarily large number of short channel ids and will chunk the requests
 * appropriately.
 */
export class ChannelsQuery {
    public chunkSize = 2000;

    private _queue: ShortChannelId[] = [];
    private _state: ChannelsQueryState;
    private _error: GossipError;
    private _resolve: () => void;
    private _reject: (error: GossipError) => void;

    constructor(
        readonly chainHash: Buffer,
        readonly peer: IMessageSenderReceiver,
        readonly logger: ILogger,
    ) {
        this._handlePeerMessage = this._handlePeerMessage.bind(this);
        this.peer.on("message", this._handlePeerMessage);
        this._state = ChannelsQueryState.Idle;
    }

    public get state() {
        return this._state;
    }

    public get error() {
        return this._error;
    }

    /**
     *
     * @param scids
     */
    public query(...scids: ShortChannelId[]): Promise<void> {
        return new Promise((resolve, reject) => {
            // enqueue the short ids
            this._queue.push(...scids);

            // Ensure we are in the active state
            this._state = ChannelsQueryState.Active;

            // send our query to the peer
            this._sendQuery();

            // capture the promise method for use when complete
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    private _transitionSuccess() {
        if (this._state !== ChannelsQueryState.Active) return;
        this.peer.off("message", this._handlePeerMessage);
        this._state = ChannelsQueryState.Complete;
        this._resolve();
    }

    private _transitionFailed(error: GossipError) {
        if (this._state !== ChannelsQueryState.Active) return;
        this.peer.off("message", this._handlePeerMessage);
        this._state = ChannelsQueryState.Failed;
        this._error = error;
        this._reject(error);
    }

    private _handlePeerMessage(msg: IWireMessage) {
        if (msg instanceof ReplyShortChannelIdsEndMessage) {
            this._onReplyShortIdsEnd(msg);
            return;
        }
    }

    private _sendQuery() {
        // splice a chunk of work to do from the suqery
        const scids = this._queue.splice(0, this.chunkSize);

        const msg = new QueryShortChannelIdsMessage();
        msg.chainHash = this.chainHash;
        msg.shortChannelIds = scids;
        this.logger.debug("sending query_short_channel_ids - scid_count:", scids.length);
        this.peer.sendMessage(msg);
    }

    private _onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage) {
        this.logger.debug("received reply_short_channel_ids_end - complete: %d", msg.complete);

        // If we receive a reply with complete=false, the remote peer
        // does not maintain up-to-date channel information for the
        // requested chain_hash
        if (!msg.complete) {
            const error = new GossipError(GossipErrorCode.ReplyChannelsNoInfo, msg);
            this._transitionFailed(error);
            return;
        }

        // This occurs when the last batch of information has been received
        // but there is still more short_channel_ids to request. This scenario
        // requires sending another QueryShortIds message
        if (this._queue.length > 0) {
            this._sendQuery();
        } else {
            this._transitionSuccess();
            return;
        }
    }
}
