import { GossipTimestampFilterMessage } from "../../messages/gossip-timestamp-filter-message";
import { ReplyShortChannelIdsEndMessage } from "../../messages/reply-short-channel-ids-end-message";
import { GossipSyncedState } from "./gossip-synced-state";
import { GossipSyncerStateBase } from "./gossip-syncer-state";

export class AwaitingShortIdsEndState extends GossipSyncerStateBase {
  constructor(context) {
    super(context);
    console.log(">>>>>>>>>>>>>>>>>>>>>", this.name);
  }

  get name() {
    return "awaiting short ids end";
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

      // transition into the sync'd state
      return new GossipSyncedState(this._context);
    }
  }
}
