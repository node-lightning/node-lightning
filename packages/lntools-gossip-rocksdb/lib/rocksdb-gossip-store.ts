import { BufferCursor } from "@lntools/buffer-cursor";
import { IGossipStore } from "@lntools/wire";
import { NodeAnnouncementMessage } from "@lntools/wire";
import { ChannelAnnouncementMessage } from "@lntools/wire";
import { ExtendedChannelAnnouncementMessage } from "@lntools/wire";
import { ChannelUpdateMessage } from "@lntools/wire";
import { OutPoint } from "@lntools/wire";
import { ShortChannelId } from "@lntools/wire";
import { shortChannelIdFromBuffer } from "@lntools/wire";
import { RocksdbBase } from "./rocksdb-base";

enum Prefix {
  ChannelAnnouncement = 1,
  ChannelUpdate = 2,
  NodeAnnouncement = 3,
  ChannelsForNode = 4,
  Outpoint = 5,
}

export class RocksdbGossipStore extends RocksdbBase implements IGossipStore {
  public async findBlockHeight(): Promise<number> {
    const result = await this._safeGet<number>(Buffer.from("height"));
    return result || 0;
  }

  public async findChannelAnnouncemnts(): Promise<ChannelAnnouncementMessage[]> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      const results: ChannelAnnouncementMessage[] = [];
      stream.on("data", data => {
        if (data.key[0] === Prefix.ChannelAnnouncement) {
          results.push(ChannelAnnouncementMessage.deserialize(data.value));
        }
      });
      stream.on("end", () => {
        resolve(results);
      });
      stream.on("error", err => reject(err));
    });
  }

  public async findChannelsForNode(nodeId: Buffer): Promise<ShortChannelId[]> {
    const key = Buffer.concat([Buffer.from([Prefix.ChannelsForNode]), nodeId]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return [];

    const reader = new BufferCursor(raw);
    const results = [];
    while (!reader.eof) {
      results.push(shortChannelIdFromBuffer(reader.readBytes(8)));
    }
    return results;
  }

  public async findNodeAnnouncement(nodeId: Buffer): Promise<NodeAnnouncementMessage> {
    const key = Buffer.concat([Buffer.from([Prefix.NodeAnnouncement]), nodeId]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return NodeAnnouncementMessage.deserialize(raw);
  }

  public async findChannelAnnouncement(scid: ShortChannelId): Promise<ChannelAnnouncementMessage> {
    const key = Buffer.concat([Buffer.from([Prefix.ChannelAnnouncement]), scid.toBuffer()]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return ChannelAnnouncementMessage.deserialize(raw);
  }

  public async findChannelAnnouncementByOutpoint(
    outpoint: OutPoint,
  ): Promise<ChannelAnnouncementMessage> {
    const key = Buffer.concat([Buffer.from([Prefix.Outpoint]), Buffer.from(outpoint.toString())]);
    const scidBuf = await this._safeGet<Buffer>(key);
    if (!scidBuf) return;
    const key2 = Buffer.concat([Buffer.from([Prefix.ChannelAnnouncement]), scidBuf]);
    const raw = await this._safeGet<Buffer>(key2);
    if (!raw) return;
    return ChannelAnnouncementMessage.deserialize(raw);
  }

  public async findChannelUpdate(scid: ShortChannelId, dir: number): Promise<ChannelUpdateMessage> {
    const key = Buffer.concat([
      Buffer.from([Prefix.ChannelUpdate]),
      scid.toBuffer(),
      Buffer.from([dir]),
    ]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return ChannelUpdateMessage.deserialize(raw);
  }

  public async saveChannelAnnouncement(msg: ChannelAnnouncementMessage): Promise<void> {
    const key = Buffer.concat([
      Buffer.from([Prefix.ChannelAnnouncement]),
      msg.shortChannelId.toBuffer(),
    ]);
    const value = msg.serialize();
    await this._db.put(key, value);

    // store outpoint reference
    if (msg instanceof ExtendedChannelAnnouncementMessage) {
      const key2 = Buffer.concat([
        Buffer.from([Prefix.Outpoint]),
        Buffer.from(msg.outpoint.toString()),
      ]);
      await this._db.put(key2, msg.shortChannelId.toBuffer());
    }

    // store channel-node refererences
    await this._saveNodeChannel(msg.shortChannelId, msg.nodeId1);
    await this._saveNodeChannel(msg.shortChannelId, msg.nodeId2);
  }

  public async saveChannelUpdate(msg: ChannelUpdateMessage): Promise<void> {
    const key = Buffer.concat([
      Buffer.from([Prefix.ChannelUpdate]),
      msg.shortChannelId.toBuffer(),
      Buffer.from([msg.direction]),
    ]);
    const value = msg.serialize();
    await this._db.put(key, value);
  }

  public async saveNodeAnnouncement(msg: NodeAnnouncementMessage): Promise<void> {
    const key = Buffer.concat([Buffer.from([Prefix.NodeAnnouncement]), msg.nodeId]);
    const value = msg.serialize();
    // todo delete node-channels
    await this._db.put(key, value);
  }

  public async deleteChannelAnnouncement(scid: ShortChannelId): Promise<void> {
    const key = Buffer.concat([Buffer.from([Prefix.ChannelAnnouncement]), scid.toBuffer()]);
    // todo delete from node1-channels
    // todo delete from node2-channels
    await this._db.del(key);
  }

  public async deleteChannelUpdate(scid: ShortChannelId, dir: number): Promise<void> {
    const key = Buffer.concat([
      Buffer.from([Prefix.ChannelUpdate]),
      scid.toBuffer(),
      Buffer.from([dir]),
    ]);
    await this._db.del(key);
  }

  public async deleteNodeAnnouncement(nodeId: Buffer): Promise<void> {
    const key = Buffer.concat([Buffer.from([Prefix.NodeAnnouncement]), nodeId]);
    await this._db.del(key);
  }

  private async _saveNodeChannel(scid: ShortChannelId, nodeId: Buffer) {
    const key = Buffer.concat([Buffer.from([Prefix.ChannelsForNode]), nodeId]);
    const scids = await this.findChannelsForNode(nodeId);
    scids.push(scid);
    const value = Buffer.concat(scids.map(p => p.toBuffer()));
    await this._db.put(key, value);
  }
}
