import { BufferCursor } from "@lntools/buffer-cursor";
import { MESSAGE_TYPE } from "../message-type";
import { IBufferSerializable } from "../serialize/buffer-serializable";
import { EncodedBufferDeserializer } from "../serialize/encoded-buffer-deserializer";
import { RawEncodedShortIdsSerializer } from "../serialize/raw-encoded-short-ids-serializer";
import { TlvStreamReader } from "../serialize/tlv-stream-reader";
import { ZlibEncodedShortIdsSerializer } from "../serialize/zlib-encoded-short-ids-serializer";
import { ShortChannelId } from "../shortchanid";
import { ReplyChannelRangeTimestamps } from "./tlvs/reply-channel-range-timestamps";
import { IWireMessage } from "./wire-message";

export class ReplyChannelRangeMessage implements IWireMessage {
  public static deserialize(payload: Buffer): ReplyChannelRangeMessage {
    const instance = new ReplyChannelRangeMessage();
    const reader = new BufferCursor(payload);

    // read type bytes
    reader.readUInt16BE();

    instance.chainHash = reader.readBytes(32);

    instance.firstBlocknum = reader.readUInt32BE();
    instance.numberOfBlocks = reader.readUInt32BE();
    instance.complete = reader.readUInt8() === 1;

    const len = reader.readUInt16BE(); // encoded_short_channel_id bytes
    const esidsBuffer = reader.readBytes(len);
    instance.shortChannelIds = new EncodedBufferDeserializer(
      new RawEncodedShortIdsSerializer(),
      new ZlibEncodedShortIdsSerializer(),
    ).deserialize(esidsBuffer);

    // read tlvs
    const tlvReader = new TlvStreamReader();
    tlvReader.register(ReplyChannelRangeTimestamps);
    const tlvs = tlvReader.read(reader);

    instance.timestamps = tlvs.find(p => p.type === ReplyChannelRangeTimestamps.type);

    return instance;
  }

  public type: MESSAGE_TYPE = MESSAGE_TYPE.REPLY_CHANNEL_RANGE;
  public chainHash: Buffer;
  public firstBlocknum: number;
  public numberOfBlocks: number;
  public complete: boolean;
  public shortChannelIds: ShortChannelId[] = [];
  public timestamps: ReplyChannelRangeTimestamps;

  public serialize(esidSerializer?: IBufferSerializable<ShortChannelId[]>): Buffer {
    if (!esidSerializer) esidSerializer = new ZlibEncodedShortIdsSerializer();
    const esids = esidSerializer.serialize(this.shortChannelIds);

    const buffer = Buffer.alloc(
      2 + // type
      32 + // chain_hash
      4 + // first_blocknum
      4 + // number_of_blocks
      1 + // complete
      2 + // len encoded_short_ids
      esids.length, // encoded_short_ids
    ); // prettier-ignore

    const writer = new BufferCursor(buffer);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.chainHash);
    writer.writeUInt32BE(this.firstBlocknum);
    writer.writeUInt32BE(this.numberOfBlocks);
    writer.writeUInt8(this.complete ? 1 : 0);
    writer.writeUInt16BE(esids.length);
    writer.writeBytes(esids);

    // encode tlvs
    if (this.timestamps) {
      writer.writeBytes(this.timestamps.serialize());
    }

    return buffer;
  }
}
