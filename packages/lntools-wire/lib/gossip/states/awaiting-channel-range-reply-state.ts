import { QueryShortChannelIdsMessage } from "../../messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../../messages/reply-channel-range-message";
import { ShortChannelId } from "../../shortchanid";
import { AwaitingShortIdsEndState } from "./awaiting-short-ids-end-state";
import { GossipSyncerStateBase } from "./gossip-syncer-state";
import { IGossipSyncerState } from "./gossip-syncer-state";

export class AwaitingChannelRangeReplyState extends GossipSyncerStateBase {
  private _shortChannelIds: ShortChannelId[] = [];

  constructor(context) {
    super(context);
    console.log(">>>>>>>>>>>>>>>>>>>>>", this.name);
  }

  public get name() {
    return "awaiting channel range reply";
  }

  public onReplyChannelRange(msg: ReplyChannelRangeMessage): IGossipSyncerState {
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
