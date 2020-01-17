import { Logger } from "@lntools/logger";
import { ChannelAnnouncementMessage } from "../../messages/channel-announcement-message";
import { QueryChannelRangeMessage } from "../../messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "../../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../../messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "../../messages/reply-short-channel-ids-end-message";
import { IWireMessage } from "../../messages/wire-message";
import { GossipSyncer } from "../gossip-syncer";

export interface IGossipSyncState {
  readonly name: string;
  onQueryChannelRange(msg: QueryChannelRangeMessage): IGossipSyncState;
  onReplyChannelRange(msg: ReplyChannelRangeMessage): IGossipSyncState;
  onQueryShortIds(msg: QueryShortChannelIdsMessage): IGossipSyncState;
  onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage): IGossipSyncState;
  onChannelAnnouncement(msg: ChannelAnnouncementMessage): IGossipSyncState;
}

// tslint:disable-next-line: max-classes-per-file
export abstract class GossipSyncStateBase implements IGossipSyncState {
  public readonly name: string;
  protected _context: GossipSyncer;
  protected _logger: Logger;

  constructor(context: GossipSyncer) {
    this._context = context;
    this._logger = context.peer.logger;
  }

  public onQueryChannelRange(msg: QueryChannelRangeMessage): IGossipSyncState {
    return this;
  }

  public onReplyChannelRange(msg: ReplyChannelRangeMessage): IGossipSyncState {
    return this;
  }
  public onQueryShortIds(msg: QueryShortChannelIdsMessage): IGossipSyncState {
    return this;
  }

  public onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage): IGossipSyncState {
    return this;
  }
  public onChannelAnnouncement(msg: ChannelAnnouncementMessage): IGossipSyncState {
    return this;
  }

  protected _sendMessage(msg: IWireMessage) {
    this._context.peer.sendMessage(msg);
  }
}
