import { BufferCursor } from "@lntools/buffer-cursor";
import { MESSAGE_TYPE } from "../message-type";
import { ShortChannelId, shortChannelIdFromBuffer } from "../shortchanid";
import { IWireMessage } from "./wire-message";

export class QueryShortChannelIdsMessage implements IWireMessage {
  public static deserialize(payload: Buffer): QueryShortChannelIdsMessage {
    const reader = new BufferCursor(payload);
    reader.readUInt16BE(); // read off type

    const instance = new QueryShortChannelIdsMessage();
    instance.chainHash = reader.readBytes(32);

    const len = reader.readUInt16BE();
    if (len) {
      const encoded = reader.readUInt8() === 1;
      let esciBuffer: Buffer;
      if (encoded) {
        throw new Error("Zlib not yet supported");
      } else {
        esciBuffer = reader.readBytes(len - 1);
      }

      const esciReader = new BufferCursor(esciBuffer);
      while (!esciReader.eof) {
        instance.shortChannelIds.push(shortChannelIdFromBuffer(esciReader.readBytes(8)));
      }
    }

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
