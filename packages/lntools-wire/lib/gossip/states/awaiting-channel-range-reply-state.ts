import { QueryShortChannelIdsMessage } from "../../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../../messages/reply-channel-range-message";
import { ShortChannelId } from "../../shortchanid";
import { GossipSyncer } from "../gossip-syncer";
import { AwaitingShortIdsEndState } from "./awaiting-short-ids-end-state";
import { GossipSyncStateBase } from "./gossip-sync-state-base";
import { IGossipSyncState } from "./gossip-sync-state-base";

export class AwaitingChannelRangeReplyState extends GossipSyncStateBase {
  public readonly name = "awaiting_channel_range_reply";
  private _shortChannelIds: ShortChannelId[] = [];

  constructor(context: GossipSyncer) {
    super(context);
    this._logger.debug("gossip sync state", this.name);
  }

  public onReplyChannelRange(msg: ReplyChannelRangeMessage): IGossipSyncState {
    // enqueue short_channel_ids until we get a complete signal
    this._shortChannelIds.push(...msg.shortChannelIds);

    // when not complete
    // this could be because there is no data or we still have more messages
    if (!msg.complete && msg.shortChannelIds.length === 0) {
      throw new Error("Need to handle this");
    } else if (!msg.complete) return this;
    else if (msg.complete && this._shortChannelIds.length === 0) {
      throw new Error("need to handle this");
    } else {
      // construct and send request for short_channel_ids
      const queryShortIds = new QueryShortChannelIdsMessage();
      queryShortIds.chainHash = msg.chainHash;
      queryShortIds.shortChannelIds = this._shortChannelIds;
      this._sendMessage(queryShortIds);

      // reset the short_channel_id queue
      this._shortChannelIds.length = 0;

      // transition to awaiting for complete values
      return new AwaitingShortIdsEndState(this._context);
    }
  }
}
