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
      // create GossipTimeoutMessage
      return new GossipSyncedState(this._context);
    }
  }
}
