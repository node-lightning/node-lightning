import { GossipTimestampFilterMessage } from "../../messages/gossip-timestamp-filter-message";
import { QueryShortChannelIdsMessage } from "../../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../../messages/reply-channel-range-message";
import { ShortChannelId } from "../../shortchanid";
import { GossipSyncer } from "../gossip-syncer";
import { ActiveState } from "./active-state";
import { AwaitingShortIdsCompleteState } from "./awaiting-short-ids-complete-state";
import { GossipSyncStateBase } from "./gossip-sync-state-base";
import { IGossipSyncState } from "./gossip-sync-state-base";
import { InactiveState } from "./inactive-state";

export class AwaitingChannelRangeCompleteState extends GossipSyncStateBase {
  public readonly name = "awaiting_channel_range_reply";
  private _shortChannelIds: ShortChannelId[] = [];

  constructor(context: GossipSyncer) {
    super(context);
    this._logger.debug("gossip sync state", this.name);
  }

  public onReplyChannelRange(msg: ReplyChannelRangeMessage): IGossipSyncState {
    // enqueue short_channel_ids until we get a complete signal
    this._shortChannelIds.push(...msg.shortChannelIds);

    // When the message isn't complete and we HAVE short_channel_id data
    // we must queue it until a complete flag is reached.
    if (!msg.complete && this._shortChannelIds.length > 0) {
      return this;
    }

    // The remote peer indicated that they do not have complete
    // information avaialble for the chain_hash. We will mark the
    // current state as inactive and will not send a gossip_timestamp_filter
    // to receive message tickle.
    if (!msg.complete && this._shortChannelIds.length === 0) {
      return new InactiveState(this._context);
    }

    // We made a request but there was no data. Because the complete
    // flag has been set, we know that the remote peer has information
    // for the chain_hash.
    if (msg.complete && this._shortChannelIds.length === 0) {
      // We pass along our gossip_timestamp_filter to indicate that we would like
      // new messages to be passed along during the normal trickle
      const gossipFilter = new GossipTimestampFilterMessage();
      gossipFilter.chainHash = this._context.chainHash;
      gossipFilter.firstTimestamp = Math.trunc(Date.now() / 1000);
      gossipFilter.timestampRange = 4294967295;
      this._sendMessage(gossipFilter);

      // Transition to active state and listen for trickle messages
      return new ActiveState(this._context);
    }

    // When we receive complete and have short_channel_ids we are in the
    // position where we can start sending short_id querie messages.
    if (msg.complete && this._shortChannelIds.length) {
      // construct and send request for short_channel_ids
      const queryShortIds = new QueryShortChannelIdsMessage();
      queryShortIds.chainHash = msg.chainHash;
      queryShortIds.shortChannelIds = this._shortChannelIds.splice(0, 8000);
      this._sendMessage(queryShortIds);

      // transition to awaiting for complete values
      return new AwaitingShortIdsCompleteState(this._context, this._shortChannelIds);
    }
  }
}
