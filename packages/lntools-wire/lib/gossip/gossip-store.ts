import { OutPoint } from "../domain/outpoint";
import { ChannelAnnouncementMessage } from "../messages/channel-announcement-message";
import { ChannelUpdateMessage } from "../messages/channel-update-message";
import { NodeAnnouncementMessage } from "../messages/node-announcement-message";
import { ShortChannelId } from "../shortchanid";

/**
 * Interface for storing, finding, and deleting gossip messages.
 */
export interface IGossipStore {
  findBlockHeight(): Promise<number>;
  findChannelsForNode(nodeId: Buffer): Promise<ShortChannelId[]>;
  findNodeAnnouncement(nodeId: Buffer): Promise<NodeAnnouncementMessage>;
  findChannelAnnouncement(scid: ShortChannelId): Promise<ChannelAnnouncementMessage>;
  findChannelAnnouncementByOutpoint(outpoint: OutPoint): Promise<ChannelAnnouncementMessage>;
  findChannelUpdate(scid: ShortChannelId, dir: number): Promise<ChannelUpdateMessage>;
  saveChannelAnnouncement(msg: ChannelAnnouncementMessage): Promise<void>;
  saveChannelUpdate(msg: ChannelUpdateMessage): Promise<void>;
  saveNodeAnnouncement(msg: NodeAnnouncementMessage): Promise<void>;
  deleteChannelAnnouncement(scid: ShortChannelId): Promise<void>;
  deleteChannelUpdate(scid: ShortChannelId, dir: number): Promise<void>;
  deleteNodeAnnouncement(nodeId: Buffer): Promise<void>;
}
