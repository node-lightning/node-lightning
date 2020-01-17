import { ChannelAnnouncementMessage } from "../../messages/channel-announcement-message";
import { QueryChannelRangeMessage } from "../../messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "../../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../../messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "../../messages/reply-short-channel-ids-end-message";
import { IWireMessage } from "../../messages/wire-message";
import { GossipSyncer } from "../gossip-syncer";

export interface IGossipSyncerState {
  readonly name: string;
  onQueryChannelRange(msg: QueryChannelRangeMessage): IGossipSyncerState;
  onReplyChannelRange(msg: ReplyChannelRangeMessage): IGossipSyncerState;
  onQueryShortIds(msg: QueryShortChannelIdsMessage): IGossipSyncerState;
  onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage): IGossipSyncerState;
  onChannelAnnouncement(msg: ChannelAnnouncementMessage): IGossipSyncerState;
}

// tslint:disable-next-line: max-classes-per-file
export abstract class GossipSyncerStateBase implements IGossipSyncerState {
  protected _context: GossipSyncer;

  constructor(context: GossipSyncer) {
    this._context = context;
  }

  public abstract get name(): string;

  public onQueryChannelRange(msg: QueryChannelRangeMessage): IGossipSyncerState {
    return this;
  }

  public onReplyChannelRange(msg: ReplyChannelRangeMessage): IGossipSyncerState {
    return this;
  }
  public onQueryShortIds(msg: QueryShortChannelIdsMessage): IGossipSyncerState {
    return this;
  }

  public onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage): IGossipSyncerState {
    return this;
  }
  public onChannelAnnouncement(msg: ChannelAnnouncementMessage): IGossipSyncerState {
    return this;
  }

  protected _sendMessage(msg: IWireMessage) {
    this._context.peer.sendMessage(msg);
  }
}
