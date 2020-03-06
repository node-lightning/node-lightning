import { ILogger } from "@lntools/logger";
import { EventEmitter } from "events";
import { MessageType } from "../message-type";
import { ChannelAnnouncementMessage } from "../messages/channel-announcement-message";
import { GossipTimestampFilterMessage } from "../messages/gossip-timestamp-filter-message";
import { QueryChannelRangeMessage } from "../messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "../messages/reply-short-channel-ids-end-message";
import { IWireMessage } from "../messages/wire-message";
import { IPeerMessageReceiver, IPeerMessageSender } from "../peer";
import { ShortChannelId } from "../shortchanid";
import { WireError } from "../wire-error";
import { GossipFilter } from "./gossip-filter";

export enum PeerGossipReceiveState {
  Inactive = "inactive",
  Active = "active",
}

/**
 * Peer gossip synchronizer is a state machine (using the state pattern)
 * that that maintains the peer's gossip state.
 */
export class PeerGossipSynchronizer extends EventEmitter {
  public readonly peer: IPeerMessageSender & IPeerMessageReceiver;
  public readonly chainHash: Buffer;
  public readonly logger: ILogger;
  public readonly filter: GossipFilter;
  public shortChannelIdsChunksSize = 8000;
  public queryReplyTimeout = 5000;

  private _queryScidQueue: ShortChannelId[] = [];
  private _rangeQueryQueue: Array<[number, number]> = [];

  private _receiveState: PeerGossipReceiveState;
  private _awaitingRangeQueryReply: boolean = false;

  constructor({
    peer,
    chainHash,
    logger,
  }: {
    chainHash: Buffer;
    logger: ILogger;
    peer: IPeerMessageReceiver & IPeerMessageSender;
  }) {
    super();
    this.chainHash = chainHash;
    this.logger = logger;

    this.peer = peer;
    this.peer.on("message", this._handlePeerMessage.bind(this));
  }

  public get awaitingRangeQueryReply() {
    return this._awaitingRangeQueryReply;
  }

  public get receiveState() {
    return this._receiveState;
  }

  public set receiveState(state: PeerGossipReceiveState) {
    this.logger.debug("receive state -", state);
    this._receiveState = state;
    this.emit("receive_state", state);
  }

  public get queryScidQueueSize() {
    return this._queryScidQueue.length;
  }

  public deactivate() {
    const gossipFilter = new GossipTimestampFilterMessage();
    gossipFilter.chainHash = this.chainHash;
    gossipFilter.firstTimestamp = 4294967295;
    gossipFilter.timestampRange = 0;
    this.peer.sendMessage(gossipFilter);
    this.receiveState = PeerGossipReceiveState.Inactive;
  }

  public activate(start: number = Math.trunc(Date.now() / 1000), range = 4294967295) {
    this.logger.info("activating gossip for range %d to %d", start, range);
    const gossipFilter = new GossipTimestampFilterMessage();
    gossipFilter.chainHash = this.chainHash;
    gossipFilter.firstTimestamp = start;
    gossipFilter.timestampRange = range;
    this.peer.sendMessage(gossipFilter);
    this.receiveState = PeerGossipReceiveState.Active;
  }

  public queryRange(firstBlocknum: number = 0, numberOfBlocks = 4294967295 - firstBlocknum) {
    // Check if a range query has already been sent and if it has
    // enqueue the query until a reply is received from the peer.
    // This is required to conform to BOLT7 which indicates a single
    // pending query message can be outstanding at one time
    if (this._awaitingRangeQueryReply) {
      this._rangeQueryQueue.push([firstBlocknum, numberOfBlocks]);
      return;
    }

    // Looks like its ok to send, so fire off that bad boy
    this._sendChannelRangeQuery(firstBlocknum, numberOfBlocks);
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

  private _sendChannelRangeQuery(firstBlocknum: number, numberOfBlocks: number) {
    this.logger.info("querying block range %d to %d", firstBlocknum, numberOfBlocks);
    this._awaitingRangeQueryReply = true;
    const queryRangeMessage = new QueryChannelRangeMessage();
    queryRangeMessage.chainHash = this.chainHash;
    queryRangeMessage.firstBlocknum = firstBlocknum;
    queryRangeMessage.numberOfBlocks = numberOfBlocks;
    this.peer.sendMessage(queryRangeMessage);
  }

  private _sendShortChannelIdsQuery() {
    const scids = this._queryScidQueue.splice(0, this.shortChannelIdsChunksSize);
    if (!scids.length) return;

    const queryShortIds = new QueryShortChannelIdsMessage();
    queryShortIds.chainHash = this.chainHash;
    queryShortIds.shortChannelIds = scids;
    this.logger.debug("sending query_short_channel_ids - scid_count:", scids.length);
    this.peer.sendMessage(queryShortIds);
  }

  private _onReplyChannelRange(msg: ReplyChannelRangeMessage) {
    this.logger.debug(
      "received reply_channel_range - complete: %d, start_block: %d, end_block: %d, scid_count: %d",
      msg.complete,
      msg.firstBlocknum,
      msg.firstBlocknum + msg.numberOfBlocks - 1,
      msg.shortChannelIds.length,
    );

    // enques any scids to be processed by a
    // query_shot_chan_id message
    for (const scid of msg.shortChannelIds) {
      this._queryScidQueue.push(scid);
    }

    // This occurs if the remote peer did not have any
    // information for the chain
    if (!msg.complete && !msg.shortChannelIds.length) {
      this.emit("channel_range_failed", msg);
    }

    // send the scid query with the results
    this._sendShortChannelIdsQuery();

    // indicate  that we are hokay to send another query message
    this._awaitingRangeQueryReply = false;

    // send the next query message if one exists
    const query = this._rangeQueryQueue.shift();
    if (query) this._sendChannelRangeQuery(...query);
  }

  private _onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage) {
    this.logger.debug("received reply_short_channel_ids_end - complete: %d", msg.complete);

    // If we receive a reply with complete=false, the remote peer
    // does not maintain up-to-date channel information for the
    // request chain_hash. We therefore transition to the inactive state
    // since this peer is not valid for receiving gossip information from
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
