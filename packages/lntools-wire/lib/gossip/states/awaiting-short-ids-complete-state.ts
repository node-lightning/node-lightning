import { GossipTimestampFilterMessage } from "../../messages/gossip-timestamp-filter-message";
import { QueryShortChannelIdsMessage } from "../../messages/query-short-channel-ids-message";
import { ReplyShortChannelIdsEndMessage } from "../../messages/reply-short-channel-ids-end-message";
import { ShortChannelId } from "../../shortchanid";
import { GossipSyncer } from "../gossip-syncer";
import { ActiveState } from "./active-state";
import { GossipSyncStateBase } from "./gossip-sync-state-base";
import { InactiveState } from "./inactive-state";

export class AwaitingShortIdsCompleteState extends GossipSyncStateBase {
  public readonly name = "awaiting_short_ids_end";
  private _shortChannelIds: ShortChannelId[];

  constructor(context: GossipSyncer, shortChannelIds?: ShortChannelId[]) {
    super(context);
    this._logger.debug("gossip sync state", this.name);
    this._shortChannelIds = shortChannelIds || [];
  }

  public onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage) {
    // If we receive a reply with complete=false, the remote peer
    // does not maintain up-to-date channel information for the
    // request chain_hash. We therefore transition to the inactive state
    // since this peer is not valid for receiving gossip information from
    if (!msg.complete) {
      return new InactiveState(this._context);
    }

    // This occurs when the last batch of information has been received
    // but there is still more short_channel_ids to request. This scenario
    // requires sending another QueryShortIds message
    if (msg.complete && this._shortChannelIds.length) {
      // construct and send request for short_channel_ids
      const queryShortIds = new QueryShortChannelIdsMessage();
      queryShortIds.chainHash = msg.chainHash;
      queryShortIds.shortChannelIds = this._shortChannelIds.splice(0, 8000);
      this._sendMessage(queryShortIds);

      // return the current state
      return this;
    }

    // This occurs when we receive a complete reply_short_ids_end message
    // and there are not more short_channel_ids left to query. At this
    // point we will transition to the active state after sending the
    // gossip_timestamp_filter message
    if (msg.complete && this._shortChannelIds.length === 0) {
      const filterMsg = new GossipTimestampFilterMessage();
      filterMsg.chainHash = this._context.chainHash;
      filterMsg.firstTimestamp = Math.trunc(Date.now() / 1000);
      filterMsg.timestampRange = 4294967295;
      this._sendMessage(filterMsg);

      // transition into the sync complete state
      return new ActiveState(this._context);
    }
  }
}
