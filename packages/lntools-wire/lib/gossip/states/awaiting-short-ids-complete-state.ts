import { ReplyShortChannelIdsEndMessage } from "../../messages/reply-short-channel-ids-end-message";
import { GossipSyncer } from "../gossip-syncer";
import { ActiveState } from "./active-state";
import { IGossipSyncState } from "./gossip-sync-state";
import { InactiveState } from "./inactive-state";

export class AwaitingShortIdsCompleteState implements IGossipSyncState {
  public readonly name = "awaiting_short_ids_end";

  public onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage, context: GossipSyncer) {
    // If we receive a reply with complete=false, the remote peer
    // does not maintain up-to-date channel information for the
    // request chain_hash. We therefore transition to the inactive state
    // since this peer is not valid for receiving gossip information from
    if (!msg.complete) {
      context.state = new InactiveState();
      return;
    }

    // This occurs when the last batch of information has been received
    // but there is still more short_channel_ids to request. This scenario
    // requires sending another QueryShortIds message
    if (msg.complete && context.hasQueuedShortIds) {
      context.sendShortChannelIdsQuery();
      return;
    }

    // This occurs when we receive a complete reply_short_ids_end message
    // and there are not more short_channel_ids left to query. At this
    // point we will transition to the active state after sending the
    // gossip_timestamp_filter message
    if (msg.complete && !context.hasQueuedShortIds) {
      context.sendGossipTimestampFilter();
      context.state = new ActiveState();
      return;
    }
  }
}
