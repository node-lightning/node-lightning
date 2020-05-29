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
 *
 * A single query_channel_range may be too large to fit in a single
 * reply_channel_range response. When this happens, there will be multiple
 * reply_channel_range responses to address the query_channel_range message.
 *
 * There are two modes of replies: Legacy LND and Standard.
 *
 * Standard was defined in changes to BOLT7 that were merged in with #730. These
 * changes clarified the meaning of the reply fields to ensure the recipient
 * of replies knows when the query has successfully completed. This includes:
 *
 *  - a node must not submit a new query_channel_range until the full set of
 *  reply_channel_range messages covering the range are received.
 *
 *  - clarified the meaning of full_information (previously complete) to
 *  indicate that the responding node contains complete information for the
 *  chain_hash, not that the reply is complete.
 *
 *  - enforces that when there are multiple reply_channel_range msgs, the
 *  range of blocks must be strictly increasing until the full query range is
 *  covered. This range may exceed (both below and above) the request range.
 *  This means:
 *     - the first reply first_blocknum must be <= requests first_blocknum
 *     - subsequent first_blocknum will be strictly increasing from the
 *     previous reply's first_blocknum+number_of_blocks
 *     - the final first_blocknum+number_of_blocks must be >= the query's
 *     first_blocknum+number_of_blocks
 *
 * This is functionality is a clarification from Legacy LND mode where
 * gossip_queries was implemented in a different manner.
 *
 * - the complete flag to indicate a multipart message that was incomplete
 * - first_blocknum+number_of_blocks matches the query for each reply message
 */
export class QueryChannelRangeStrategy extends EventEmitter implements IQueryChannelRangeStrategy {
  private _rangeQueryQueue: Array<[number, number]> = [];
  private _blocked: boolean = false;
  private _isLegacy = false;
  private _lastQuery: QueryChannelRangeMessage;

  constructor(
    readonly chainHash: Buffer,
    readonly peer: IMessageSenderReceiver,
    readonly logger: ILogger,
    readonly queryShortIdsStrategy: IQueryShortIdsStrategy,
  ) {
    super();
    this._isLegacy = false;
    this.peer.on("message", this._handlePeerMessage.bind(this));
  }

  public get awaitingRangeQueryReply() {
    return this._blocked;
  }

  public get isLegacy() {
    return this._isLegacy;
  }

  public queryRange(firstBlocknum: number = 0, numberOfBlocks = 4294967295 - firstBlocknum) {
    // enqueue the range query
    this._rangeQueryQueue.push([firstBlocknum, numberOfBlocks]);

    // Check if a range query has already been sent and if it has enqueue the
    // query until a reply is received from the peer. This is required to
    // conform to BOLT7 which indicates a single pending query message can be
    // outstanding at one time.

    if (!this._blocked) {
      this._sendQuery();
    }
  }

  private _handlePeerMessage(msg: IWireMessage) {
    if (msg instanceof ReplyChannelRangeMessage) {
      this._onReplyChannelRange(msg);
      return;
    }
  }

  private _sendQuery() {
    // if no work to do, return
    const query = this._rangeQueryQueue.shift();
    if (!query) return;

    const [firstBlocknum, numberOfBlocks] = query;
    this.logger.info(
      "sending query_channel_range start_block=%d end_block=%d",
      firstBlocknum,
      firstBlocknum + numberOfBlocks - 1,
    );

    // lock on sending
    this._blocked = true;

    // send message
    const msg = new QueryChannelRangeMessage();
    msg.chainHash = this.chainHash;
    msg.firstBlocknum = firstBlocknum;
    msg.numberOfBlocks = numberOfBlocks;
    this.peer.sendMessage(msg);

    // capture the active query to see how the response stacks up
    this._lastQuery = msg;
  }

  /**
   * Handles the reply_chan_range message using loose rules. That is we take
   * into account that complete=false only indicates a failure if there are
   * not SCIDs attached to the message
   * @param msg
   */
  private _onReplyChannelRange(msg: ReplyChannelRangeMessage) {
    this.logger.debug(
      "received reply_channel_range - complete=%d start_block=%d end_block=%d scid_count=%d",
      msg.complete,
      msg.firstBlocknum,
      msg.firstBlocknum + msg.numberOfBlocks - 1,
      msg.shortChannelIds.length,
    );

    // check if this has the signature of a legacy reply. We can detect this by
    // looking at a false complete/full_information flag, scids exist,
    // and the first_blocknum and number_of_blocks matches the values in the
    // query.
    if (
      !this._isLegacy &&
      !msg.complete &&
      msg.shortChannelIds.length &&
      msg.firstBlocknum === this._lastQuery.firstBlocknum &&
      msg.numberOfBlocks === this._lastQuery.numberOfBlocks
    ) {
      this._isLegacy = true;
      this.logger.info("using legacy LND query_channel_range technique");
    }

    if (msg.shortChannelIds.length) {
      // enqueues any scids to be processed by a query_short_chan_id message
      this.queryShortIdsStrategy.enqueue(...msg.shortChannelIds);
    }

    // legacy operation
    if (this._isLegacy) {
      // Check the complete flag and the existance of SCIDs. Unfortunately,
      // non-confirming implementations are incorrectly using the completion
      // flag to a multi-message reply.
      if (!msg.complete && !msg.shortChannelIds.length) {
        this.emit("channel_range_failed", msg);
      }

      // indicate that we are okay to send another query message. We are doing
      // this because we have no other way of knowing if the query has completed,
      // which may piss some peers off.
      this._blocked = false;

      // clear out the active query
      this._lastQuery = undefined;

      // send the next query message if one exists
      this._sendQuery();
    }

    // normal operation
    else {
      // The full_information flag should only return false when the remote peer
      // does not maintain up-to-date infromatino for the request chain_hash
      if (!msg.complete) {
        this.emit("channel_range_failed", msg);
      }

      // We can unblock when we have received a reply that covers the full range
      // of requested data. We know the final block height will be the querie's
      // first_blocknum + number_of_blocks. At this point, we can unblock
      // sending and clear out the active query.
      const currentHeight = msg.firstBlocknum + msg.numberOfBlocks;
      const targetHeight = this._lastQuery.firstBlocknum + this._lastQuery.numberOfBlocks;
      if (currentHeight >= targetHeight) {
        this._blocked = false;
        this.logger.debug(
          "received final reply_channel_range height %d >= query_channel_range height %d",
          currentHeight,
          targetHeight,
        );

        // send the next query message since we have successfully completed the query
        this._sendQuery();
      }
    }
  }
}
