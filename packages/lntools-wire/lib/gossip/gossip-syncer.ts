import { MESSAGE_TYPE } from "../message-type";
import { ChannelAnnouncementMessage } from "../messages/channel-announcement-message";
import { QueryChannelRangeMessage } from "../messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "../messages/reply-short-channel-ids-end-message";
import { IWireMessage } from "../messages/wire-message";
import { Peer } from "../peer";
import { AwaitingChannelRangeReplyState } from "./states/awaiting-channel-range-reply-state";
import { IGossipSyncerState } from "./states/gossip-syncer-state";
import { PendingState } from "./states/pending-state";

export type GossipContextOptions = {
  peer: Peer;
  chainHash: Buffer;
  fullSync?: boolean;
};

export class GossipSyncer {
  public peer: Peer;
  private _fullSync: boolean;
  private _chainHash: Buffer;
  private _state: IGossipSyncerState;

  constructor(options: GossipContextOptions) {
    this.peer = options.peer;
    this._chainHash = options.chainHash;
    this._fullSync = options.fullSync || true;
    this._state = new PendingState(this);

    this.peer.on("ready", this.start.bind(this));
    this.peer.on("message", this._handleMessage.bind(this));
  }

  get state() {
    return this._state;
  }

  public start() {
    const firstBlocknum = 0;
    const numberOfBlocks = 4294967295;
    if (!this._fullSync) {
      // query the messageStore to see what message we need
    }
    const queryRangeMessage = new QueryChannelRangeMessage();
    queryRangeMessage.chainHash = this._chainHash;
    queryRangeMessage.firstBlocknum = firstBlocknum;
    queryRangeMessage.numberOfBlocks = numberOfBlocks;
    this.peer.sendMessage(queryRangeMessage);
    this._state = new AwaitingChannelRangeReplyState(this);
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
