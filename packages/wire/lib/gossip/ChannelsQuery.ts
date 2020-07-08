import { ILogger } from "@lntools/logger";
import { EventEmitter } from "events";
import { IWireMessage } from "../messages/IWireMessage";
import { QueryShortChannelIdsMessage } from "../messages/QueryShortChannelIdsMessage";
import { ReplyShortChannelIdsEndMessage } from "../messages/ReplyShortChannelIdsEndMessage";
import { IMessageSenderReceiver } from "../Peer";
import { ShortChannelId } from "../ShortChannelId";
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
export class ChannelsQuery extends EventEmitter {
    public chunkSize = 2000;

    private _queue: ShortChannelId[] = [];
    private _state: ChannelsQueryState;
    private _error: GossipError;

    constructor(
        readonly chainHash: Buffer,
        readonly peer: IMessageSenderReceiver,
        readonly logger: ILogger,
    ) {
        super();
        this.peer.on("message", this._handlePeerMessage.bind(this));
        this._state = ChannelsQueryState.Idle;
    }

    public get state() {
        return this._state;
    }

    public get error() {
        return this._error;
    }

    /**
     * @param scids
     */
    public query(...scids: ShortChannelId[]) {
        // enqueue the short ids
        this._queue.push(...scids);

        // Ensure we are in the active state
        this._state = ChannelsQueryState.Active;

        // send our query to the peer
        this._sendQuery();
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
            const error = new GossipError(GossipErrorCode.ReplyChannelRangeNoInformation, msg);
            this._state = ChannelsQueryState.Failed;
            this._error = error;
            this.emit("error", error);
            return;
        }

        // This occurs when the last batch of information has been received
        // but there is still more short_channel_ids to request. This scenario
        // requires sending another QueryShortIds message
        if (this._queue.length > 0) {
            this._sendQuery();
        } else {
            this._state = ChannelsQueryState.Complete;
            this.emit("complete");
        }
    }
}
