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
  onQueryChannelRange?(msg: QueryChannelRangeMessage, context: GossipSyncer): void;
  onReplyChannelRange?(msg: ReplyChannelRangeMessage, context: GossipSyncer): void;
  onQueryShortIds?(msg: QueryShortChannelIdsMessage, context: GossipSyncer): void;
  onReplyShortIdsEnd?(msg: ReplyShortChannelIdsEndMessage, context: GossipSyncer): void;
  onChannelAnnouncement?(msg: ChannelAnnouncementMessage, context: GossipSyncer): void;
  onFilterFlushed?(context: GossipSyncer): void;
}
