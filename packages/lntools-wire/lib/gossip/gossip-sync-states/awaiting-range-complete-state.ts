import { ReplyChannelRangeMessage } from "../../messages/reply-channel-range-message";
import { ShortChannelId } from "../../shortchanid";
import { GossipSyncer } from "../gossip-syncer";
import { ActiveState } from "./active-state";
import { AwaitingSyncComplete } from "./awaiting-sync-complete";
import { IGossipSyncState } from "./gossip-sync-state";
import { InactiveState } from "./inactive-state";

export class AwaitingRangeCompleteState implements IGossipSyncState {
  public readonly name = "awaiting_range_complete";

  public scidQueue: ShortChannelId[] = [];
  public replyTimeout: NodeJS.Timeout;

  // public onReplyChannelRange(msg: ReplyChannelRangeMessage, context: GossipSyncer) {
  //   context.logger.info("received range with", msg.complete, msg.shortChannelIds.length);

  //   // When the message isn't complete and we HAVE short_channel_id data
  //   // we must queue it until a complete flag is reached.
  //   if (!msg.complete && msg.shortChannelIds.length) {
  //     this.scidQueue.push(...msg.shortChannelIds);
  //     return;
  //   }

  //   // The remote peer indicated that they do not have complete
  //   // information avaialble for the chain_hash. We will mark the
  //   // current state as inactive and will not send a gossip_timestamp_filter
  //   // to receive message tickle.
  //   if (!msg.complete && !msg.shortChannelIds.length) {
  //     context.state = new InactiveState();
  //     return;
  //   }

  //   // We made a request but there was no data. Because the complete
  //   // flag has been set, we know that the remote peer has information
  //   // for the chain_hash. Sinc we are complete, we send the gossip_timestamp_filter
  //   // and transition to the acive state to receive trickle message updates
  //   // from the remote peer
  //   if (msg.complete && !msg.shortChannelIds.length) {
  //     context.state = new InactiveState();
  //     return;
  //   }

  //   // When we receive complete and have short_channel_ids we are in the
  //   // position where we can start sending short_id querie messages.
  //   if (msg.complete && msg.shortChannelIds.length) {
  //     this.scidQueue.push(...msg.shortChannelIds);
  //     const scids = this.scidQueue.splice(0, context.shortChannelIdsChunksSize);
  //     context.state = new AwaitingSyncComplete(this.scidQueue, scids);
  //     context.sendShortChannelIdsQuery(scids);
  //   }
  // }

  public onReplyChannelRange(msg: ReplyChannelRangeMessage, context: GossipSyncer) {
    context.logger.info(
      "received reply_channel_range - complete: %d, start_block: %d, end_block: %d, scid_count: %d",
      msg.complete,
      msg.firstBlocknum,
      msg.firstBlocknum + msg.numberOfBlocks - 1,
      msg.shortChannelIds.length,
    );

    this.scidQueue.push(...msg.shortChannelIds);

    clearTimeout(this.replyTimeout);
    this.replyTimeout = setTimeout(() => {
      const scids = this.scidQueue.splice(0, context.shortChannelIdsChunksSize);
      context.state = new AwaitingSyncComplete(this.scidQueue, scids);
      context.sendShortChannelIdsQuery(scids);
    }, 1000);
  }
}
