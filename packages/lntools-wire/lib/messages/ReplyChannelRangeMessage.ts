import { BufferCursor } from "@lntools/buffer-cursor";
import { MessageType } from "../MessageType";
import { Encoder } from "../serialize/Encoder";
import { EncodingType } from "../serialize/EncodingType";
import { TlvStreamReader } from "../serialize/TlvStreamReader";
import { ShortChannelId } from "../ShortChannelId";
import { shortChannelIdFromBuffer } from "../ShortChannelIdUtils";
import { IWireMessage } from "./IWireMessage";
import { ReplyChannelRangeChecksums } from "./tlvs/ReplyChannelRangeChecksums";
import { ReplyChannelRangeTimestamps } from "./tlvs/ReplyChannelRangeTimestamps";

export class ReplyChannelRangeMessage implements IWireMessage {
  public static deserialize(payload: Buffer): ReplyChannelRangeMessage {
    const instance = new ReplyChannelRangeMessage();
    const reader = new BufferCursor(payload);

    // read type bytes
    reader.readUInt16BE();

    instance.chainHash = reader.readBytes(32);

    instance.firstBlocknum = reader.readUInt32BE();
    instance.numberOfBlocks = reader.readUInt32BE();
    instance.fullInformation = reader.readUInt8() === 1;

    // read encoded_short_ids
    const len = reader.readUInt16BE(); // encoded_short_channel_id bytes
    const encodedShortIds = reader.readBytes(len);
    const rawShortIds = new Encoder().decode(encodedShortIds);
    const reader2 = new BufferCursor(rawShortIds);
    while (!reader2.eof) {
      instance.shortChannelIds.push(shortChannelIdFromBuffer(reader2.readBytes(8)));
    }

    // read tlvs
    const tlvReader = new TlvStreamReader();
    tlvReader.register(ReplyChannelRangeTimestamps);
    tlvReader.register(ReplyChannelRangeChecksums);
    const tlvs = tlvReader.read(reader);

    instance.timestamps = tlvs.find(p => p.type === ReplyChannelRangeTimestamps.type);
    instance.checksums = tlvs.find(p => p.type === ReplyChannelRangeChecksums.type);

    return instance;
  }

  public type: MessageType = MessageType.ReplyChannelRange;
  public chainHash: Buffer;
  public firstBlocknum: number;
  public numberOfBlocks: number;
  public fullInformation: boolean;
  public shortChannelIds: ShortChannelId[] = [];
  public timestamps: ReplyChannelRangeTimestamps;
  public checksums: ReplyChannelRangeChecksums;

  public serialize(encoding: EncodingType = EncodingType.ZlibDeflate): Buffer {
    // encode short channel ids
    const rawSids = Buffer.concat(this.shortChannelIds.map(p => p.toBuffer()));
    const esids = new Encoder().encode(encoding, rawSids);

    const timestampsTlv = this.timestamps ? this.timestamps.serialize(encoding) : Buffer.alloc(0);
    const checksumsTlv = this.checksums ? this.checksums.serialize() : Buffer.alloc(0);
    const buffer = Buffer.alloc(
      2 + // type
      32 + // chain_hash
      4 + // first_blocknum
      4 + // number_of_blocks
      1 + // full_information
      2 + // len encoded_short_ids
      esids.length + // encoded_short_ids
      timestampsTlv.length +
      checksumsTlv.length,
    ); // prettier-ignore

    const writer = new BufferCursor(buffer);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.chainHash);
    writer.writeUInt32BE(this.firstBlocknum);
    writer.writeUInt32BE(this.numberOfBlocks);
    writer.writeUInt8(this.fullInformation ? 1 : 0);
    writer.writeUInt16BE(esids.length);
    writer.writeBytes(esids);

    if (timestampsTlv.length) {
      writer.writeBytes(timestampsTlv);
    }
    if (checksumsTlv.length) {
      writer.writeBytes(checksumsTlv);
    }

    return buffer;
  }
}
