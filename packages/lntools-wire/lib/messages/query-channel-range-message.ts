import { BufferCursor } from "@lntools/buffer-cursor";
import { MESSAGE_TYPE } from "../message-type";

export class QueryChannelRangeMessage {
  public static deserialize(payload: Buffer): QueryChannelRangeMessage {
    const instance = new QueryChannelRangeMessage();
    const reader = new BufferCursor(payload);

    // read type bytes
    reader.readUInt16BE();

    instance.chainHash = reader.readBytes(32);
    instance.firstBlocknum = reader.readUInt32BE();
    instance.numberOfBlocks = reader.readUInt32BE();

    return instance;
  }

  public type: MESSAGE_TYPE = MESSAGE_TYPE.QUERY_CHANNEL_RANGE;
  public chainHash: Buffer;
  public firstBlocknum: number;
  public numberOfBlocks: number;

  public serialize(): Buffer {
    const buffer = Buffer.alloc(
      2 + // type
      32 + // chain_hash
      4 + // first_blocknum
      4 + // number_of_blocks
      0, // tlvs go here...
    ); // prettier-ignore
    const writer = new BufferCursor(buffer);
    writer.writeUInt16BE(MESSAGE_TYPE.QUERY_CHANNEL_RANGE);
    writer.writeBytes(this.chainHash);
    writer.writeUInt32BE(this.firstBlocknum);
    writer.writeUInt32BE(this.numberOfBlocks);
    return buffer;
  }
}
