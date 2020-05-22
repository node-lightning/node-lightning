import { ILogger } from "@lntools/logger";
import { EventEmitter } from "events";
import { QueryChannelRangeMessage } from "../messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "../messages/reply-short-channel-ids-end-message";
import { IWireMessage } from "../messages/wire-message";
import { IMessageSenderReceiver } from "../peer";
import { ShortChannelId } from "../shortchanid";

/**
 * This class handles gossip synchronization for a non-strict gossip_queries.
 * It subscribes to a peer and listens for the reply_channel_range and
 * reply_short_channel_ids_end messsages.
 *
 * It mainains two states that throttle message sending
 *  - one for tracking outstanding query_channel_range messages
 *  - one for tracking outstanding query_short_channel_ids messages
 *
 * Because of variances in implementation of gossip_queries, it cannot determine
 * when a query_channel_range is complete.
 *
 * A single query_channel_range message will generate many
 * reply_query_channel_range message.
 *
 *          query_channel_range -> reply_query_channel_range {1,n}
 *
 * The "loose" implementation take into consideration various usages of the
 * complete, firstBlockNum and numberOfBlocks. This class only treats
 * complete=false as a failure when there are no SCIDs attached to the
 * reply_query_chan_range message. This is because some implementations were
 * using the complete={true/false} to indicate the completion of a multi-message
 * result.
 *
 * The query_short_channel_id logic is simpler and just iterates until no more
 * messages are available.
 */
export class PeerGossipSynchronizer extends EventEmitter {
  public shortChannelIdsChunksSize = 8000;
  public queryReplyTimeout = 5000;

  private _queryScidQueue: ShortChannelId[] = [];
  private _rangeQueryQueue: Array<[number, number]> = [];
  private _awaitingRangeQueryReply: boolean = false;

  constructor(
    readonly chainHash: Buffer,
    readonly peer: IMessageSenderReceiver,
    readonly logger: ILogger,
  ) {
    super();
    this.peer.on("message", this._handlePeerMessage.bind(this));
  }

  public get awaitingRangeQueryReply() {
    return this._awaitingRangeQueryReply;
  }

  public get queryScidQueueSize() {
    return this._queryScidQueue.length;
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

    if (msg instanceof ReplyShortChannelIdsEndMessage) {
      this._onReplyShortIdsEnd(msg);
      return;
    }
  }

  private _sendChannelRangeQuery() {
    // if no work to do, return
    const query = this._rangeQueryQueue.shift();
    if (!query) return;

    // ensure not sending

    const [firstBlocknum, numberOfBlocks] = query;
    this.logger.info("querying block range %d to %d", firstBlocknum, numberOfBlocks);
    this._awaitingRangeQueryReply = true;

    // send message
    const msg = new QueryChannelRangeMessage();
    msg.chainHash = this.chainHash;
    msg.firstBlocknum = firstBlocknum;
    msg.numberOfBlocks = numberOfBlocks;
    this.peer.sendMessage(msg);
  }

  private _sendShortChannelIdsQuery() {
    // if no work to do, return
    const scids = this._queryScidQueue.splice(0, this.shortChannelIdsChunksSize);
    if (!scids.length) return;

    const msg = new QueryShortChannelIdsMessage();
    msg.chainHash = this.chainHash;
    msg.shortChannelIds = scids;
    this.logger.debug("sending query_short_channel_ids - scid_count:", scids.length);
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
    for (const scid of msg.shortChannelIds) {
      this._queryScidQueue.push(scid);
    }

    // Check the complete flag and the existance of SCIDs. Unfortunately,
    // non-confirming implementations are incorrectly using the completion
    // flag to a multi-message reply.
    if (!msg.complete && !msg.shortChannelIds.length) {
      this.emit("channel_range_failed", msg);
    }

    // send the scid query with the results
    this._sendShortChannelIdsQuery();

    // indicate that we are okay to send another query message. We are doing
    // this because we have no other way of knowing if the query has completed,
    // which may piss some peers off.
    this._awaitingRangeQueryReply = false;

    // send the next query message if one exists
    this._sendChannelRangeQuery();
  }

  private _onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage) {
    this.logger.debug("received reply_short_channel_ids_end - complete: %d", msg.complete);

    // If we receive a reply with complete=false, the remote peer
    // does not maintain up-to-date channel information for the
    // request chain_hash
    if (!msg.complete) {
      this.emit("query_short_channel_ids_failed", msg);
    }

    // This occurs when the last batch of information has been received
    // but there is still more short_channel_ids to request. This scenario
    // requires sending another QueryShortIds message
    if (this._queryScidQueue.length > 0) {
      this._sendShortChannelIdsQuery();
      return;
    }
  }
}
