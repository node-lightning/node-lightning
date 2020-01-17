import { GossipTimestampFilterMessage } from "../../messages/gossip-timestamp-filter-message";
import { ReplyShortChannelIdsEndMessage } from "../../messages/reply-short-channel-ids-end-message";
import { GossipSyncer } from "../gossip-syncer";
import { ActiveState } from "./active-state";
import { GossipSyncStateBase } from "./gossip-sync-state-base";

export class AwaitingShortIdsEndState extends GossipSyncStateBase {
  public readonly name = "awaiting_short_ids_end";

  constructor(context: GossipSyncer) {
    super(context);
    this._logger.debug("gossip sync state", this.name);
  }

  public onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage) {
    if (!msg.complete) {
      throw new Error("Need to handle this");
    } else {
      // now that messages are fully synced, we will transmit the
      // gossip_timestamp_filter message to limit future peer broadcasts
      // to the current date and time
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
