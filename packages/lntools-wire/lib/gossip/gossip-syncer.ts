import { MESSAGE_TYPE } from "../message-type";
import { ChannelAnnouncementMessage } from "../messages/channel-announcement-message";
import { QueryChannelRangeMessage } from "../messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "../messages/reply-short-channel-ids-end-message";
import { IWireMessage } from "../messages/wire-message";
import { Peer } from "../peer";
import { AwaitingChannelRangeCompleteState } from "./states/awaiting-channel-range-complete-state";
import { IGossipSyncState } from "./states/gossip-sync-state-base";
import { InactiveState } from "./states/inactive-state";

export type GossipContextOptions = {
  peer: Peer;
  chainHash: Buffer;
};

/**
 * Gossip synchronizer is a state machine (using the state pattern)
 * that transitions through states as gossip_messages are received from the
 * peer.
 */
export class GossipSyncer {
  public readonly peer: Peer;
  public readonly chainHash: Buffer;
  private _state: IGossipSyncState;

  constructor(options: GossipContextOptions) {
    this.peer = options.peer;
    this.chainHash = options.chainHash;
    this._state = new InactiveState(this);
    this.peer.on("message", this._handleMessage.bind(this));
  }

  public get state() {
    return this._state;
  }

  public start(full: boolean) {
    const firstBlocknum = 0;
    const numberOfBlocks = 4294967295;
    if (!full) {
      // query the messageStore to see what message we need
    }
    const queryRangeMessage = new QueryChannelRangeMessage();
    queryRangeMessage.chainHash = this.chainHash;
    queryRangeMessage.firstBlocknum = firstBlocknum;
    queryRangeMessage.numberOfBlocks = numberOfBlocks;
    this.peer.sendMessage(queryRangeMessage);
    this._state = new AwaitingChannelRangeCompleteState(this);
  }

  private _handleMessage(msg: IWireMessage) {
    switch (msg.type) {
      case MESSAGE_TYPE.QUERY_CHANNEL_RANGE:
        this._state = this._state.onQueryChannelRange(msg as QueryChannelRangeMessage);
        break;
      case MESSAGE_TYPE.REPLY_CHANNEL_RANGE:
        this._state = this._state.onReplyChannelRange(msg as ReplyChannelRangeMessage);
        break;
      case MESSAGE_TYPE.QUERY_SHORT_CHANNEL_IDS:
        this._state = this._state.onQueryShortIds(msg as QueryShortChannelIdsMessage);
        break;
      case MESSAGE_TYPE.REPLY_SHORT_CHANNEL_IDS_END:
        this._state = this._state.onReplyShortIdsEnd(msg as ReplyShortChannelIdsEndMessage);
        break;
      case MESSAGE_TYPE.CHANNEL_ANNOUNCEMENT:
        this._state = this._state.onChannelAnnouncement(msg as ChannelAnnouncementMessage);
    }
  }
}
