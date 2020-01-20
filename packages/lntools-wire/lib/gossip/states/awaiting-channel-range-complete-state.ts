import { ReplyChannelRangeMessage } from "../../messages/reply-channel-range-message";
import { GossipSyncer } from "../gossip-syncer";
import { ActiveState } from "./active-state";
import { AwaitingShortIdsCompleteState } from "./awaiting-short-ids-complete-state";
import { IGossipSyncState } from "./gossip-sync-state";
import { InactiveState } from "./inactive-state";

export class AwaitingChannelRangeCompleteState implements IGossipSyncState {
  public readonly name = "awaiting_channel_range_complete";

  public onReplyChannelRange(msg: ReplyChannelRangeMessage, context: GossipSyncer) {
    // When the message isn't complete and we HAVE short_channel_id data
    // we must queue it until a complete flag is reached.
    if (!msg.complete && msg.shortChannelIds.length) {
      context.enqueueShortChannelIds(msg.shortChannelIds);
      return;
    }

    // The remote peer indicated that they do not have complete
    // information avaialble for the chain_hash. We will mark the
    // current state as inactive and will not send a gossip_timestamp_filter
    // to receive message tickle.
    if (!msg.complete && !msg.shortChannelIds.length) {
      context.state = new InactiveState();
      return;
    }

    // We made a request but there was no data. Because the complete
    // flag has been set, we know that the remote peer has information
    // for the chain_hash. Sinc we are complete, we send the gossip_timestamp_filter
    // and transition to the acive state to receive trickle message updates
    // from the remote peer
    if (msg.complete && !msg.shortChannelIds.length) {
      context.sendGossipTimestampFilter();
      context.state = new ActiveState();
      return;
    }

    // When we receive complete and have short_channel_ids we are in the
    // position where we can start sending short_id querie messages.
    if (msg.complete && msg.shortChannelIds.length) {
      context.enqueueShortChannelIds(msg.shortChannelIds);
      context.sendShortChannelIdsQuery();
      context.state = new AwaitingShortIdsCompleteState();
      return;
    }
  }
}
