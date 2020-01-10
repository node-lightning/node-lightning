import { BufferCursor } from "@lntools/buffer-cursor";
import { MESSAGE_TYPE } from "../message-type";
import { ShortChannelId, shortChannelIdFromBuffer } from "../shortchanid";
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

  public type: MESSAGE_TYPE = MESSAGE_TYPE.REPLY_CHANNEL_RANGE;
  public chainHash: Buffer;
  public firstBlocknum: number;
  public numberOfBlocks: number;
  public complete: boolean;
  public shortChannelIds: ShortChannelId[] = [];

  public serialize(): Buffer {
    const len = this.shortChannelIds.length * 8 + 1;
    const buffer = Buffer.alloc(
      2 + // type
      32 + // chain_hash
      4 + // first_blocknum
      4 + // number_of_blocks
      1 + // complete
      2 + // len encoded_channel_ids
      len, // encoded_channel_ids
    ); // prettier-ignore
    const writer = new BufferCursor(buffer);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.chainHash);
    writer.writeUInt32BE(this.firstBlocknum);
    writer.writeUInt32BE(this.numberOfBlocks);
    writer.writeUInt8(this.complete ? 1 : 0);
    writer.writeUInt16BE(len);
    writer.writeUInt8(0);
    for (const scid of this.shortChannelIds) {
      writer.writeBytes(scid.toBuffer());
    }
    return buffer;
  }
}
