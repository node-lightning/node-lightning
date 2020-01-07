import { BufferCursor } from "@lntools/buffer-cursor";
import { MESSAGE_TYPE } from "../message-type";
import { ShortChannelId, shortChannelIdFromBuffer } from "../shortchanid";

export class ReplyChannelRangeMessage {
  public static deserialize(payload: Buffer): ReplyChannelRangeMessage {
    const instance = new ReplyChannelRangeMessage();
    const reader = new BufferCursor(payload);

    // read type bytes
    reader.readUInt16BE();

    instance.chainHash = reader.readBytes(32);

    instance.firstBlocknum = reader.readUInt32BE();
    instance.numberOfBlocks = reader.readUInt32BE();
    instance.complete = reader.readUInt8() === 1;

    // encoded_short_channel_id bytes
    const len = reader.readUInt16BE();
    if (len) {
      const encoded = reader.readUInt8() === 1;
      let esciBuffer: Buffer;
      if (encoded) {
        // TODO zlib decompress values
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

  public type: MESSAGE_TYPE = MESSAGE_TYPE.REPLY_CHANNEL_RANGE;
  public chainHash: Buffer;
  public firstBlocknum: number;
  public numberOfBlocks: number;
  public complete: boolean;
  public shortChannelIds: ShortChannelId[] = [];

  // public serialize(): Buffer {
  //   const buffer = Buffer.alloc(
  //     2 + // type
  //     32 + // chain_hash
  //     4 + // first_blocknum
  //     4 + // number_of_blocks
  //     0, // tlvs go here...
  //   ); // prettier-ignore
  //   const writer = new BufferCursor(buffer);
  //   writer.writeUInt16BE(MESSAGE_TYPE.QUERY_CHANNEL_RANGE);
  //   writer.writeBytes(this.chainHash);
  //   writer.writeUInt32BE(this.firstBlocknum);
  //   writer.writeUInt32BE(this.numberOfBlocks);
  //   return buffer;
  // }
}
