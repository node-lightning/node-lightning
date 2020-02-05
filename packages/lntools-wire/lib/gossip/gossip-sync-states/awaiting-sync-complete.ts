import { ChannelAnnouncementMessage } from "../../messages/channel-announcement-message";
import { ReplyShortChannelIdsEndMessage } from "../../messages/reply-short-channel-ids-end-message";
import { ShortChannelId } from "../../shortchanid";
import { GossipSyncer } from "../gossip-syncer";
import { ActiveState } from "./active-state";
import { IGossipSyncState } from "./gossip-sync-state";
import { InactiveState } from "./inactive-state";

export class AwaitingSyncComplete implements IGossipSyncState {
  public readonly name = "awaiting_sync_complete";

  public scidQueue: ShortChannelId[];
  public scidsSet: Set<string>;
  public completeHandle: NodeJS.Timeout;

  public constructor(scids: ShortChannelId[], sent: ShortChannelId[]) {
    this.scidQueue = scids;
    this.scidsSet = new Set(
      sent.map(scid => scid.toString()).concat(scids.map(scid => scid.toString())),
    );
  }

  public get hasSentAllQueries() {
    return this.scidQueue.length === 0;
  }

  public get hasReceivedAllMessages() {
    return this.scidsSet.size === 0;
  }

  public onReplyShortIdsEnd(msg: ReplyShortChannelIdsEndMessage, context: GossipSyncer) {
    // If we receive a reply with complete=false, the remote peer
    // does not maintain up-to-date channel information for the
    // request chain_hash. We therefore transition to the inactive state
    // since this peer is not valid for receiving gossip information from
    if (!msg.complete) {
      context.state = new InactiveState();
      return;
    }

    // This occurs when the last batch of information has been received
    // but there is still more short_channel_ids to request. This scenario
    // requires sending another QueryShortIds message
    if (!this.hasSentAllQueries) {
      const scids = this.scidQueue.splice(0, context.shortChannelIdsChunksSize);
      context.sendShortChannelIdsQuery(scids);
      return;
    }

    // This occurs if we have sent all queries and processed all expected
    // messages from the peer. In this case, we tranistion to an active state.
    if (this.hasSentAllQueries && this.hasReceivedAllMessages) {
      context.state = new ActiveState();
      return;
    }
  }

  // public onChannelAnnouncement(msg: ChannelAnnouncementMessage, context: GossipSyncer) {
  //   // remove the channel_announcement from the list of channels
  //   // that need to be processed.
  //   this.scidsSet.delete(msg.shortChannelId.toString());

  //   // Check if we have sent all queries and processed all expected
  //   // messages from the peer. If we have, we tranistion to an active state.
  //   if (this.hasSentAllQueries && this.hasReceivedAllMessages) {
  //     context.state = new ActiveState();
  //     return;
  //   }
  // }

  public onChannelAnnouncement(msg: ChannelAnnouncementMessage, context: GossipSyncer) {
    // remove the channel_announcement from the list of channels
    // that need to be processed.
    this.scidsSet.delete(msg.shortChannelId.toString());

    console.log("remaining", this.scidsSet.size);

    if (this.hasSentAllQueries) {
      clearTimeout(this.completeHandle);
      this.completeHandle = setTimeout(() => {
        context.state = new ActiveState();
      }, 5000);
      return;
    }
  }

  // public onFilterFlushed(context: GossipSyncer) {
  //   // Check if we have sent all queries and processed all expected
  //   // messages from the peer. If we have, we tranistion to an active state.
  //   if (this.hasSentAllQueries) {
  //     context.state = new ActiveState();
  //     return;
  //   }
  // }
}
