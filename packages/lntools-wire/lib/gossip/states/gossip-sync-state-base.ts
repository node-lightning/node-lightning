// tslint:disable: no-empty

import { Logger } from "@lntools/logger";
import { ChannelAnnouncementMessage } from "../../messages/channel-announcement-message";
import { QueryChannelRangeMessage } from "../../messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "../../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../../messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "../../messages/reply-short-channel-ids-end-message";
import { GossipSyncer } from "../gossip-syncer";

export interface IGossipSyncState {
  readonly name: string;
  logger: Logger;
  context: GossipSyncer;
  onQueryChannelRange(msg: QueryChannelRangeMessage): void;
  onReplyChannelRange(msg: ReplyChannelRangeMessage): void;
  onQueryShortIds(msg: QueryShortChannelIdsMessage): void;
  onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage): void;
  onChannelAnnouncement(msg: ChannelAnnouncementMessage): void;
}

// tslint:disable-next-line: max-classes-per-file
export abstract class GossipSyncStateBase implements IGossipSyncState {
  public readonly name: string;
  public logger: Logger;
  public context: GossipSyncer;

  public constructor({ context, logger }) {
    this.context = context;
    this.logger = logger;
  }

  public onQueryChannelRange(msg: QueryChannelRangeMessage) {}
  public onReplyChannelRange(msg: ReplyChannelRangeMessage) {}
  public onQueryShortIds(msg: QueryShortChannelIdsMessage) {}

  public onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage) {}

  public onChannelAnnouncement(msg: ChannelAnnouncementMessage) {}
}
