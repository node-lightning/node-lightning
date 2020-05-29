import { ILogger } from "@lntools/logger";
import { EventEmitter } from "events";
import { QueryChannelRangeMessage } from "../messages/query-channel-range-message";
import { ReplyChannelRangeMessage } from "../messages/reply-channel-range-message";
import { IWireMessage } from "../messages/wire-message";
import { IMessageSenderReceiver } from "../peer";
import { IQueryChannelRangeStrategy } from "./IQueryChannelRangeStrategy";
import { IQueryShortIdsStrategy } from "./IQueryShortIdsStrategy";

/**
 * This controls the query_channel_range behavior and ensures there is only a
 * single message in flight at a single time.
 */
export class QueryChannelRangeStrategy extends EventEmitter implements IQueryChannelRangeStrategy {
  private _rangeQueryQueue: Array<[number, number]> = [];
  private _awaitingRangeQueryReply: boolean = false;

  constructor(
    readonly chainHash: Buffer,
    readonly peer: IMessageSenderReceiver,
    readonly logger: ILogger,
    readonly queryShortIdsStrategy: IQueryShortIdsStrategy,
  ) {
    super();
    this.peer.on("message", this._handlePeerMessage.bind(this));
  }

  public get awaitingRangeQueryReply() {
    return this._awaitingRangeQueryReply;
  }

  public queryRange(firstBlocknum: number = 0, numberOfBlocks = 4294967295 - firstBlocknum) {
    // enqueue the range query
    this._rangeQueryQueue.push([firstBlocknum, numberOfBlocks]);

    // Check if a range query has already been sent and if it has enqueue the
    // query until a reply is received from the peer. This is required to
    // conform to BOLT7 which indicates a single pending query message can be
    // outstanding at one time.
    if (!this._awaitingRangeQueryReply) {
      this._sendChannelRangeQuery();
    }
  }

  private _handlePeerMessage(msg: IWireMessage) {
    if (msg instanceof ReplyChannelRangeMessage) {
      this._onReplyChannelRange(msg);
      return;
    }
  }

  private _sendChannelRangeQuery() {
    // if no work to do, return
    const query = this._rangeQueryQueue.shift();
    if (!query) return;

    const [firstBlocknum, numberOfBlocks] = query;
    this.logger.info("querying block range %d to %d", firstBlocknum, numberOfBlocks);

    // lock on sending
    this._awaitingRangeQueryReply = true;

    // send message
    const msg = new QueryChannelRangeMessage();
    msg.chainHash = this.chainHash;
    msg.firstBlocknum = firstBlocknum;
    msg.numberOfBlocks = numberOfBlocks;
    this.peer.sendMessage(msg);
  }

  /**
   * Handles the reply_chan_range message using loose rules. That is we take
   * into account that complete=false only indicates a failure if there are
   * not SCIDs attached to the message
   * @param msg
   */
  private _onReplyChannelRange(msg: ReplyChannelRangeMessage) {
    this.logger.debug(
      "received reply_channel_range - complete: %d, start_block: %d, end_block: %d, scid_count: %d",
      msg.complete,
      msg.firstBlocknum,
      msg.firstBlocknum + msg.numberOfBlocks - 1,
      msg.shortChannelIds.length,
    );

    // enqueues any scids to be processed by a query_short_chan_id message
    if (msg.shortChannelIds.length) {
      this.queryShortIdsStrategy.enqueue(...msg.shortChannelIds);
    }

    // Check the complete flag and the existance of SCIDs. Unfortunately,
    // non-confirming implementations are incorrectly using the completion
    // flag to a multi-message reply.
    if (!msg.complete && !msg.shortChannelIds.length) {
      this.emit("channel_range_failed", msg);
    }

    // indicate that we are okay to send another query message. We are doing
    // this because we have no other way of knowing if the query has completed,
    // which may piss some peers off.
    this._awaitingRangeQueryReply = false;

    // send the next query message if one exists
    this._sendChannelRangeQuery();
  }
}
