import { BufferCursor } from "@lntools/buffer-cursor";
import { MESSAGE_TYPE } from "../message-type";
import { TlvStreamReader } from "../serialize/tlv-stream-reader";
import { QueryChannelRangeOptions } from "./tlvs/query-channel-range-options";
import { IWireMessage } from "./wire-message";

export class QueryChannelRangeMessage implements IWireMessage {
  public static deserialize(payload: Buffer): QueryChannelRangeMessage {
    const instance = new QueryChannelRangeMessage();
    const reader = new BufferCursor(payload);

    reader.readUInt16BE(); // read type bytes
    instance.chainHash = reader.readBytes(32);
    instance.firstBlocknum = reader.readUInt32BE();
    instance.numberOfBlocks = reader.readUInt32BE();

    // try parse of tlvs
    const tlvStreamReader = new TlvStreamReader();
    tlvStreamReader.register(QueryChannelRangeOptions);
    const tlvs = tlvStreamReader.read(reader);
    instance.options = tlvs.find(p => p.type === QueryChannelRangeOptions.type);

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

  /**
   * Optional options
   */
  public options: QueryChannelRangeOptions;

  public serialize(): Buffer {
    const optionsBuffer = this.options ? this.options.serialize() : Buffer.alloc(0);
    const buffer = Buffer.alloc(
      2 + // type
      32 + // chain_hash
      4 + // first_blocknum
      4 + // number_of_blocks
      optionsBuffer.length, // options tlv
    ); // prettier-ignore
    const writer = new BufferCursor(buffer);
    writer.writeUInt16BE(MESSAGE_TYPE.QUERY_CHANNEL_RANGE);
    writer.writeBytes(this.chainHash);
    writer.writeUInt32BE(this.firstBlocknum);
    writer.writeUInt32BE(this.numberOfBlocks);
    if (this.options) {
      writer.writeBytes(optionsBuffer);
    }
    return buffer;
  }
}
