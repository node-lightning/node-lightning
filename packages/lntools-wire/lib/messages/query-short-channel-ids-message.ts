import { BufferCursor } from "@lntools/buffer-cursor";
import { MESSAGE_TYPE } from "../message-type";
import { ShortChannelId, shortChannelIdToBuffer } from "../shortchanid";

export class QueryShortChannelIdsMessage {
  public static deserialize(payload: Buffer): QueryShortChannelIdsMessage {
    const reader = new BufferCursor(payload);
    reader.readUInt16BE(); // read off type

    const instance = new QueryShortChannelIdsMessage();
    instance.chainHash = reader.readBytes(32);

    const len = reader.readUInt16BE();

    return instance;
  }

  /**
   * Type 261
   */
  public type: MESSAGE_TYPE = MESSAGE_TYPE.QUERY_SHORT_CHANNEL_IDS;

  /**
   * 32-byte chain hash
   */
  public chainHash: Buffer;

  /**
   * List of channels to query
   */
  public shortChannelIds: ShortChannelId[] = [];

  public serialize(): Buffer {
    const len = this.shortChannelIds.length * 8 + 1;
    const buffer = Buffer.alloc(
      2 + // type
      32 + // chain_hash
      2 + // len
      len + // encoded_short_ids
      0, // tlv
    ); // prettier-ignore

    const writer = new BufferCursor(buffer);
    writer.writeUInt16BE(this.type);

    writer.writeBytes(this.chainHash);
    writer.writeUInt16BE(len);

    // encoded_short_channel_ids
    // TODO add deflate
    writer.writeUInt8(0); // encoding byte
    for (const shortChannelId of this.shortChannelIds) {
      writer.writeBytes(shortChannelId.toBuffer());
    }

    return buffer;
  }
}
