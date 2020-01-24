import { Logger } from "@lntools/logger";
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
import { AwaitingChannelRangeCompleteState } from "./states/awaiting-channel-range-complete-state";
import { IGossipSyncState } from "./states/gossip-sync-state";
import { InactiveState } from "./states/inactive-state";

export type GossipSyncerOptions = {
  chainHash: Buffer;
  logger: Logger;
  peer: IPeerMessageReceiver & IPeerMessageSender;
};

/**
 * Gossip synchronizer is a state machine (using the state pattern)
 * that transitions through states as gossip_messages are received from the
 * peer.
 */
export class GossipSyncer {
  public readonly peer: IPeerMessageSender & IPeerMessageReceiver;
  public readonly chainHash: Buffer;
  public readonly logger: Logger;
  public shortChannelIdsChunksSize = 8000;

  private _state: IGossipSyncState;
  private _scids: ShortChannelId[] = [];

  constructor({ peer, chainHash, logger }: GossipSyncerOptions) {
    this.peer = peer;
    this.chainHash = chainHash;
    this.logger = logger;
    this.peer.on("message", this._handleMessage.bind(this));
    this.state = new InactiveState();
  }

  public get state() {
    return this._state;
  }

  public set state(state: IGossipSyncState) {
    this.logger.debug("transitioned to", state.name);
    this._state = state;
  }

  public get hasQueuedShortIds() {
    return this._scids.length > 0;
  }

  public requestSync(firstBlocknum: number = 0, numberOfBlocks = 4294967295) {
    const queryRangeMessage = new QueryChannelRangeMessage();
    queryRangeMessage.chainHash = this.chainHash;
    queryRangeMessage.firstBlocknum = firstBlocknum;
    queryRangeMessage.numberOfBlocks = numberOfBlocks;
    this.peer.sendMessage(queryRangeMessage);
    this.state = new AwaitingChannelRangeCompleteState();
  }

  public enqueueShortChannelIds(scids: ShortChannelId[]) {
    this._scids.push(...scids);
  }

  public sendGossipTimestampFilter() {
    const gossipFilter = new GossipTimestampFilterMessage();
    gossipFilter.chainHash = this.chainHash;
    gossipFilter.firstTimestamp = Math.trunc(Date.now() / 1000);
    gossipFilter.timestampRange = 4294967295;
    this.peer.sendMessage(gossipFilter);
  }

  public sendShortChannelIdsQuery() {
    const queryShortIds = new QueryShortChannelIdsMessage();
    queryShortIds.chainHash = this.chainHash;
    queryShortIds.shortChannelIds = this._scids.splice(0, this.shortChannelIdsChunksSize);
    this.peer.sendMessage(queryShortIds);
  }

  private _handleMessage(msg: IWireMessage) {
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
        if (this._state.onChannelAnnouncement) {
          this._state.onChannelAnnouncement(msg as ChannelAnnouncementMessage, this);
        }
    }
  }
}
