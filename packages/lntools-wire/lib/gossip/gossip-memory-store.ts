import { OutPoint } from "../domain/outpoint";
import { ChannelAnnouncementMessage } from "../messages/channel-announcement-message";
import { ChannelUpdateMessage } from "../messages/channel-update-message";
import { ExtendedChannelAnnouncementMessage } from "../messages/extended-channel-announcement-message";
import { NodeAnnouncementMessage } from "../messages/node-announcement-message";
import { ShortChannelId, shortChannelIdFromNumber } from "../shortchanid";
import { IGossipStore } from "./gossip-store";

/**
 * In-memory implementation of the IGossipStore.
 */
export class GossipMemoryStore implements IGossipStore {
  private _channelAnn = new Map<bigint, ChannelAnnouncementMessage>();
  private _channelByOutPoint = new Map<string, bigint>();
  private _channelUpd = new Map<bigint, ChannelUpdateMessage>();
  private _nodeAnn = new Map<string, NodeAnnouncementMessage>();
  private _nodeChannels = new Map<string, Set<bigint>>();

  get channelAnnouncementCount() {
    return this._channelAnn.size;
  }

  get channelUpdateCount() {
    return this._channelUpd.size;
  }

  get nodeAnnouncementCount() {
    return this._nodeAnn.size;
  }

  public async saveChannelAnnouncement(msg: ChannelAnnouncementMessage): Promise<void> {
    const chanKey = getChanKey(msg.shortChannelId);
    this._channelAnn.set(chanKey, msg);
    if (msg instanceof ExtendedChannelAnnouncementMessage) {
      this._channelByOutPoint.set(msg.outpoint.toString(), msg.shortChannelId.toNumber());
    }
    await this._saveNodeChannel(msg.nodeId1, chanKey);
    await this._saveNodeChannel(msg.nodeId2, chanKey);
  }

  public async saveChannelUpdate(msg: ChannelUpdateMessage): Promise<void> {
    this._channelUpd.set(getChanUpdKey(getChanKey(msg.shortChannelId), msg.direction), msg);
  }

  public async saveNodeAnnouncement(msg: NodeAnnouncementMessage): Promise<void> {
    this._nodeAnn.set(getNodeKey(msg.nodeId), msg);
  }

  public async findChannelsForNode(nodeId: Buffer): Promise<ShortChannelId[]> {
    const scidInts = this._nodeChannels.get(getNodeKey(nodeId));
    const results = [];
    if (!scidInts) return results;
    for (const scidInt of scidInts) {
      results.push(shortChannelIdFromNumber(scidInt));
    }
    return results;
  }

  public async findNodeAnnouncement(nodeId: Buffer): Promise<NodeAnnouncementMessage> {
    return this._nodeAnn.get(getNodeKey(nodeId));
  }

  public async findChannelAnnouncemnts(): Promise<ChannelAnnouncementMessage[]> {
    return Array.from(this._channelAnn.values());
  }

  public async findChannelAnnouncement(scid: ShortChannelId): Promise<ChannelAnnouncementMessage> {
    return this._channelAnn.get(getChanKey(scid));
  }

  public async findChannelAnnouncementByOutpoint(
    outpoint: OutPoint,
  ): Promise<ChannelAnnouncementMessage> {
    const scidNum = this._channelByOutPoint.get(outpoint.toString());
    return this._channelAnn.get(scidNum);
  }

  public async findChannelUpdate(scid: ShortChannelId, dir: number): Promise<ChannelUpdateMessage> {
    return this._channelUpd.get(getChanUpdKey(getChanKey(scid), dir));
  }

  public async deleteChannelAnnouncement(scid: ShortChannelId): Promise<void> {
    const msg = await this.findChannelAnnouncement(scid);
    if (!msg) return;
    const chanKey = getChanKey(scid);
    this._channelAnn.delete(getChanKey(scid));
    this._nodeChannels.get(getNodeKey(msg.nodeId1)).delete(chanKey);
    this._nodeChannels.get(getNodeKey(msg.nodeId2)).delete(chanKey);
  }

  public async deleteChannelUpdate(scid: ShortChannelId, dir: number) {
    this._channelUpd.delete(getChanUpdKey(getChanKey(scid), dir));
  }

  public async deleteNodeAnnouncement(nodeId: Buffer) {
    this._nodeAnn.delete(getNodeKey(nodeId));
    this._nodeChannels.get(getNodeKey(nodeId));
  }

  private async _saveNodeChannel(nodeId: Buffer, chanKey: bigint) {
    const nodeKey = getNodeKey(nodeId);
    this._nodeChannels.set(nodeKey, this._nodeChannels.get(nodeKey) || new Set<bigint>());
    this._nodeChannels.get(nodeKey).add(chanKey);
  }
}

function getNodeKey(nodeId: Buffer): string {
  return nodeId.toString("hex");
}

function getChanKey(scid: ShortChannelId): bigint {
  return scid.toNumber();
}

function getChanUpdKey(chanKey: bigint, direction: number): bigint {
  return (chanKey << BigInt(8)) | BigInt(direction);
}
