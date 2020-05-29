import { ILogger } from "@lntools/logger";
import { EventEmitter } from "events";
import { QueryShortChannelIdsMessage } from "../messages/query-short-channel-ids-message";
import { ReplyShortChannelIdsEndMessage } from "../messages/reply-short-channel-ids-end-message";
import { IWireMessage } from "../messages/wire-message";
import { IMessageSenderReceiver } from "../peer";
import { ShortChannelId } from "../shortchanid";
import { IQueryShortIdsStrategy } from "./IQueryShortIdsStrategy";

/**
 * This class manages the state machine for executing query_short_channel_ids
 * and ensuring that there is only a single inflight message at one time.
 */
export class QueryShortIdsStrategy extends EventEmitter implements IQueryShortIdsStrategy {
  public chunkSize = 8000;

  private _queue: ShortChannelId[] = [];
  private _awaitingReply: boolean;

  constructor(
    readonly chainHash: Buffer,
    readonly peer: IMessageSenderReceiver,
    readonly logger: ILogger,
  ) {
    super();
    this.peer.on("message", this._handlePeerMessage.bind(this));
    this._awaitingReply = false;
  }

  /**
   * @param scids
   */
  public enqueue(...scids: ShortChannelId[]) {
    // enqueue the short ids
    this._queue.push(...scids);

    // abort if we are currently waiting for a reply since we cannot have more
    // than one message in flight at a time
    if (this._awaitingReply) return;

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

    // if no work to do, return
    if (!scids.length) return;

    const msg = new QueryShortChannelIdsMessage();
    msg.chainHash = this.chainHash;
    msg.shortChannelIds = scids;
    this.logger.debug("sending query_short_channel_ids - scid_count:", scids.length);
    this.peer.sendMessage(msg);

    // mark the flag inidicate that a query is in flight
    this._awaitingReply = true;
  }

  private _onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage) {
    this.logger.debug("received reply_short_channel_ids_end - complete: %d", msg.complete);

    // disable the flag that indicates we are awaiting a reply
    this._awaitingReply = false;

    // If we receive a reply with complete=false, the remote peer
    // does not maintain up-to-date channel information for the
    // requested chain_hash
    if (!msg.complete) {
      this.emit("query_short_channel_ids_failed", msg);
    }

    // This occurs when the last batch of information has been received
    // but there is still more short_channel_ids to request. This scenario
    // requires sending another QueryShortIds message
    if (this._queue.length > 0) {
      this._sendQuery();
      return;
    }
  }
}
