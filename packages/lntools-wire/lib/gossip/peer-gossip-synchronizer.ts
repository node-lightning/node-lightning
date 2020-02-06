import { Logger } from "@lntools/logger";
import { EventEmitter } from "events";
import { MESSAGE_TYPE } from "../message-type";
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

export enum PeerGossipQueryState {
  Pending = "pending",
  AwaitingRanges = "awaiting_ranges",
  AwaitingScids = "awaiting_scids",
  Complete = "complete",
  Failed = "failed",
}

/**
 * Peer gossip synchronizer is a state machine (using the state pattern)
 * that that maintains the peer's gossip state.
 */
export class PeerGossipSynchronizer extends EventEmitter {
  public readonly peer: IPeerMessageSender & IPeerMessageReceiver;
  public readonly chainHash: Buffer;
  public readonly logger: Logger;
  public readonly filter: GossipFilter;
  public shortChannelIdsChunksSize = 8000;
  public queryReplyTimeout = 5000;

  private _queryScidQueue: ShortChannelId[] = [];
  private _queryScidSet: Set<string> = new Set();

  private _receiveState: PeerGossipReceiveState;
  private _queryState: PeerGossipQueryState;

  constructor({
    peer,
    chainHash,
    logger,
  }: {
    chainHash: Buffer;
    logger: Logger;
    peer: IPeerMessageReceiver & IPeerMessageSender;
  }) {
    super();
    this.chainHash = chainHash;
    this.logger = logger;

    this.peer = peer;
    this.peer.on("message", this._handlePeerMessage.bind(this));
  }

  public get queryState() {
    return this._queryState;
  }

  public set queryState(state: PeerGossipQueryState) {
    this.logger.debug("query state -", state);
    this._queryState = state;
    this.emit("query_state", state);
  }

  public get receiveState() {
    return this._receiveState;
  }

  public set receiveState(state: PeerGossipReceiveState) {
    this.logger.debug("receive state -", state);
    this._receiveState = state;
    this.emit("receive_state", state);
  }

  public deactivate() {
    const gossipFilter = new GossipTimestampFilterMessage();
    gossipFilter.chainHash = this.chainHash;
    gossipFilter.firstTimestamp = 4294967295;
    gossipFilter.timestampRange = 0;
    this.peer.sendMessage(gossipFilter);
    this.receiveState = PeerGossipReceiveState.Inactive;
  }

  public activate(start: number = Math.trunc(Date.now() / 1000), range: number = 4294967295) {
    const gossipFilter = new GossipTimestampFilterMessage();
    gossipFilter.chainHash = this.chainHash;
    gossipFilter.firstTimestamp = start;
    gossipFilter.timestampRange = range;
    this.peer.sendMessage(gossipFilter);
    this.receiveState = PeerGossipReceiveState.Active;
  }

  public syncRange(firstBlocknum: number = 0, numberOfBlocks = 4294967295) {
    const queryRangeMessage = new QueryChannelRangeMessage();
    queryRangeMessage.chainHash = this.chainHash;
    queryRangeMessage.firstBlocknum = firstBlocknum;
    queryRangeMessage.numberOfBlocks = numberOfBlocks;
    this.peer.sendMessage(queryRangeMessage);
    this.queryState = PeerGossipQueryState.AwaitingRanges;
  }

  private _sendShortChannelIdsQuery() {
    const scids = this._queryScidQueue.splice(0, this.shortChannelIdsChunksSize);
    const queryShortIds = new QueryShortChannelIdsMessage();
    queryShortIds.chainHash = this.chainHash;
    queryShortIds.shortChannelIds = scids;
    this.logger.debug("sending query_short_channel_ids - scid_count:", scids.length);
    this.peer.sendMessage(queryShortIds);
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

    // if (msg instanceof ChannelAnnouncementMessage) {
    //   this._onChannelAnnouncement(msg);
    //   return;
    // }
  }

  private _onReplyChannelRange(msg: ReplyChannelRangeMessage) {
    this.logger.debug(
      "received reply_channel_range - complete: %d, start_block: %d, end_block: %d, scid_count: %d",
      msg.complete,
      msg.firstBlocknum,
      msg.firstBlocknum + msg.numberOfBlocks - 1,
      msg.shortChannelIds.length,
    );

    for (const scid of msg.shortChannelIds) {
      this._queryScidQueue.push(scid);
      // this._queryScidSet.add(scid.toString());
    }

    switch (this.queryState) {
      case PeerGossipQueryState.AwaitingRanges:
        this.queryState = PeerGossipQueryState.AwaitingScids;
        this._sendShortChannelIdsQuery();
        break;
    }
  }

  private _onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage) {
    switch (this.queryState) {
      case PeerGossipQueryState.AwaitingScids:
        {
          // If we receive a reply with complete=false, the remote peer
          // does not maintain up-to-date channel information for the
          // request chain_hash. We therefore transition to the inactive state
          // since this peer is not valid for receiving gossip information from
          if (!msg.complete) {
            this.queryState = PeerGossipQueryState.Failed;
            return;
          }

          // This occurs when the last batch of information has been received
          // but there is still more short_channel_ids to request. This scenario
          // requires sending another QueryShortIds message
          if (this._queryScidQueue.length > 0) {
            this._sendShortChannelIdsQuery();
            return;
          }

          // Successfully finished querying. We should expected messages
          // to stream in to the client, but the gossip synchronizer
          // has done its job.
          this.queryState = PeerGossipQueryState.Complete;
          this.queryState = PeerGossipQueryState.Pending;
        }
        break;
    }
  }

  // private _onChannelAnnouncement(msg: ChannelAnnouncementMessage) {
  //   this._queryScidSet.delete(msg.shortChannelId.toString());
  // }
}
