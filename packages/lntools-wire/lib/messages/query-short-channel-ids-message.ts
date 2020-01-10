import { BufferCursor } from "@lntools/buffer-cursor";
import { MESSAGE_TYPE } from "../message-type";
import { IBufferSerializable } from "../serialize/buffer-serializable";
import { EncodedBufferDeserializer } from "../serialize/encoded-buffer-deserializer";
import { RawEncodedShortIdsSerializer } from "../serialize/raw-encoded-short-ids-serializer";
import { ZlibEncodedShortIdsSerializer } from "../serialize/zlib-encoded-short-ids-serializer";
import { ShortChannelId, shortChannelIdFromBuffer } from "../shortchanid";
import { IWireMessage } from "./wire-message";

export class QueryShortChannelIdsMessage implements IWireMessage {
  public static deserialize(payload: Buffer): QueryShortChannelIdsMessage {
    const reader = new BufferCursor(payload);
    reader.readUInt16BE(); // read off type

    const instance = new QueryShortChannelIdsMessage();
    instance.chainHash = reader.readBytes(32);

    const len = reader.readUInt16BE();
    const esidBuffer = reader.readBytes(len);
    instance.shortChannelIds = new EncodedBufferDeserializer(
      new RawEncodedShortIdsSerializer(),
      new ZlibEncodedShortIdsSerializer(),
    ).deserialize(esidBuffer);

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

  public serialize(esidSerializer?: IBufferSerializable<ShortChannelId[]>): Buffer {
    if (!esidSerializer) esidSerializer = new ZlibEncodedShortIdsSerializer();
    const esids = esidSerializer.serialize(this.shortChannelIds);
    const buffer = Buffer.alloc(
      2 + // type
      32 + // chain_hash
      2 + // encoded_short_ids len
      esids.length + // encoded_short_ids
      0, // tlv
    ); // prettier-ignore

    const writer = new BufferCursor(buffer);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.chainHash);
    writer.writeUInt16BE(esids.length);
    writer.writeBytes(esids);
    return buffer;
  }
}
