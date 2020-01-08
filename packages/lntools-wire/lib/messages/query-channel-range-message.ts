import { BufferCursor } from "@lntools/buffer-cursor";
import { MESSAGE_TYPE } from "../message-type";

export class QueryChannelRangeMessage {
  public static deserialize(payload: Buffer): QueryChannelRangeMessage {
    const instance = new QueryChannelRangeMessage();
    const reader = new BufferCursor(payload);

    reader.readUInt16BE(); // read type bytes
    instance.chainHash = reader.readBytes(32);
    instance.firstBlocknum = reader.readUInt32BE();
    instance.numberOfBlocks = reader.readUInt32BE();
    return instance;
  }

  /**
   * Type 263
   */
  public type: MESSAGE_TYPE = MESSAGE_TYPE.QUERY_CHANNEL_RANGE;

  /**
   * 32-byte hash that uniquely identifies the chain that the reply
   * should refer to
   */
  public chainHash: Buffer;

  /**
   * The first block it wants to know channels for
   */
  public firstBlocknum: number;

  /**
   * Number of blocks to return, must be 1 or greater
   */
  public numberOfBlocks: number;

  public serialize(): Buffer {
    const buffer = Buffer.alloc(
      2 + // type
      32 + // chain_hash
      4 + // first_blocknum
      4 + // number_of_blocks
      0, // tlvs
    ); // prettier-ignore
    const writer = new BufferCursor(buffer);
    writer.writeUInt16BE(MESSAGE_TYPE.QUERY_CHANNEL_RANGE);
    writer.writeBytes(this.chainHash);
    writer.writeUInt32BE(this.firstBlocknum);
    writer.writeUInt32BE(this.numberOfBlocks);
    // TODO TLVS
    return buffer;
  }
}
