import { ReplyChannelRangeMessage } from "../../messages/reply-channel-range-message";
import { ActiveState } from "./active-state";
import { AwaitingShortIdsCompleteState } from "./awaiting-short-ids-complete-state";
import { GossipSyncStateBase } from "./gossip-sync-state-base";
import { IGossipSyncState } from "./gossip-sync-state-base";
import { InactiveState } from "./inactive-state";

export class AwaitingChannelRangeCompleteState extends GossipSyncStateBase {
  public readonly name = "awaiting_channel_range_complete";

  constructor({ context, logger }) {
    super({ context, logger });
    this.logger.debug("gossip sync state", this.name);
  }

  public onReplyChannelRange(msg: ReplyChannelRangeMessage) {
    // When the message isn't complete and we HAVE short_channel_id data
    // we must queue it until a complete flag is reached.
    if (!msg.complete && msg.shortChannelIds.length) {
      this.context.enqueueShortChannelIds(msg.shortChannelIds);
      return;
    }

    // The remote peer indicated that they do not have complete
    // information avaialble for the chain_hash. We will mark the
    // current state as inactive and will not send a gossip_timestamp_filter
    // to receive message tickle.
    if (!msg.complete && !msg.shortChannelIds.length) {
      this.context.state = new InactiveState({ context: this.context, logger: this.logger });
      return;
    }

    // We made a request but there was no data. Because the complete
    // flag has been set, we know that the remote peer has information
    // for the chain_hash. Sinc we are complete, we send the gossip_timestamp_filter
    // and transition to the acive state to receive trickle message updates
    // from the remote peer
    if (msg.complete && !msg.shortChannelIds.length) {
      this.context.sendGossipTimestampFilter();
      this.context.state = new ActiveState({ context: this.context, logger: this.logger });
      return;
    }

    // When we receive complete and have short_channel_ids we are in the
    // position where we can start sending short_id querie messages.
    if (msg.complete && msg.shortChannelIds.length) {
      this.context.enqueueShortChannelIds(msg.shortChannelIds);
      this.context.sendShortChannelIdsQuery();
      this.context.state = new AwaitingShortIdsCompleteState({
        context: this.context,
        logger: this.logger,
      });
      return;
    }
  }
}
