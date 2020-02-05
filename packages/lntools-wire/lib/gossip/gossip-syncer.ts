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
import { AwaitingRangeCompleteState } from "./gossip-sync-states/awaiting-range-complete-state";
import { IGossipSyncState } from "./gossip-sync-states/gossip-sync-state";
import { InactiveState } from "./gossip-sync-states/inactive-state";

export type GossipSyncerOptions = {
  chainHash: Buffer;
  logger: Logger;
  peer: IPeerMessageReceiver & IPeerMessageSender;
  filter: GossipFilter;
};

/**
 * Peer gossip synchronizer is a state machine (using the state pattern)
 * that that maintains the peer's gossip state.
 */
export class GossipSyncer extends EventEmitter {
  public readonly peer: IPeerMessageSender & IPeerMessageReceiver;
  public readonly chainHash: Buffer;
  public readonly logger: Logger;
  public readonly filter: GossipFilter;
  public shortChannelIdsChunksSize = 8000;

  private _state: IGossipSyncState;

  constructor({ peer, filter, chainHash, logger }: GossipSyncerOptions) {
    super();
    this.chainHash = chainHash;
    this.logger = logger;
    this.state = new InactiveState();

    this.peer = peer;
    this.peer.on("message", this._handlePeerMessage.bind(this));

    this.filter = filter;
    this.filter.on("message", this._handleFilterMessage.bind(this));
    this.filter.on("error", this._handleFilterError.bind(this));
    this.filter.on("flushed", this._filterFlushed.bind(this));
  }

  public get state() {
    return this._state;
  }

  public set state(state: IGossipSyncState) {
    this.logger.debug("transitioned to", state.name);
    this._state = state;
  }

  public requestSync(firstBlocknum: number = 0, numberOfBlocks = 4294967295) {
    const queryRangeMessage = new QueryChannelRangeMessage();
    queryRangeMessage.chainHash = this.chainHash;
    queryRangeMessage.firstBlocknum = firstBlocknum;
    queryRangeMessage.numberOfBlocks = numberOfBlocks;
    this.peer.sendMessage(queryRangeMessage);
    this.state = new AwaitingRangeCompleteState();
  }

  public sendGossipTimestampFilter() {
    const gossipFilter = new GossipTimestampFilterMessage();
    gossipFilter.chainHash = this.chainHash;
    gossipFilter.firstTimestamp = Math.trunc(Date.now() / 1000);
    gossipFilter.timestampRange = 4294967295;
    this.peer.sendMessage(gossipFilter);
  }

  public sendShortChannelIdsQuery(scids: ShortChannelId[]) {
    this.logger.info("sending query_short_channel_ids - scid_count:", scids.length);
    const queryShortIds = new QueryShortChannelIdsMessage();
    queryShortIds.chainHash = this.chainHash;
    queryShortIds.shortChannelIds = scids;
    this.peer.sendMessage(queryShortIds);
  }

  private _handlePeerMessage(msg: IWireMessage) {
    switch (msg.type) {
      case MESSAGE_TYPE.QUERY_CHANNEL_RANGE:
        if (this._state.onQueryChannelRange) {
          this._state.onQueryChannelRange(msg as QueryChannelRangeMessage, this);
        }
        break;
      case MESSAGE_TYPE.REPLY_CHANNEL_RANGE:
        if (this._state.onReplyChannelRange) {
          this._state.onReplyChannelRange(msg as ReplyChannelRangeMessage, this);
        }
        break;
      case MESSAGE_TYPE.QUERY_SHORT_CHANNEL_IDS:
        if (this._state.onQueryShortIds) {
          this._state.onQueryShortIds(msg as QueryShortChannelIdsMessage, this);
        }
        break;
      case MESSAGE_TYPE.REPLY_SHORT_CHANNEL_IDS_END:
        if (this._state.onReplyShortIdsEnd) {
          this._state.onReplyShortIdsEnd(msg as ReplyShortChannelIdsEndMessage, this);
        }
        break;
      case MESSAGE_TYPE.CHANNEL_ANNOUNCEMENT:
      case MESSAGE_TYPE.CHANNEL_UPDATE:
      case MESSAGE_TYPE.NODE_ANNOUNCEMENT:
        this.filter.enqueue(msg);
        break;
    }
  }

  private _handleFilterMessage(msg: IWireMessage) {
    switch (msg.type) {
      case MESSAGE_TYPE.CHANNEL_ANNOUNCEMENT:
        if (this._state.onChannelAnnouncement) {
          this._state.onChannelAnnouncement(msg as ChannelAnnouncementMessage, this);
        }
    }
  }

  private _handleFilterError(err: WireError, msg: IWireMessage) {
    switch (msg.type) {
      case MESSAGE_TYPE.CHANNEL_ANNOUNCEMENT:
        if (this._state.onChannelAnnouncement) {
          this._state.onChannelAnnouncement(msg as ChannelAnnouncementMessage, this);
        }
    }
  }

  private _filterFlushed() {
    if (this._state.onFilterFlushed) {
      this._state.onFilterFlushed(this);
    }
  }
}
