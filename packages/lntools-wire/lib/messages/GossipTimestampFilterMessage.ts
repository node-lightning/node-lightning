import { BufferCursor } from "@lntools/buffer-cursor";
import { MessageType } from "../message-type";
import { IWireMessage } from "./IWireMessage";

export class GossipTimestampFilterMessage implements IWireMessage {
  public static deserialize(payload: Buffer): GossipTimestampFilterMessage {
    const instance = new GossipTimestampFilterMessage();
    const reader = new BufferCursor(payload);
    reader.readUInt16BE(); // read off type
    instance.chainHash = reader.readBytes(32);
    instance.firstTimestamp = reader.readUInt32BE();
    instance.timestampRange = reader.readUInt32BE();
    return instance;
  }

  public type: MessageType = MessageType.GossipTimestampFilter;
  public chainHash: Buffer;
  public firstTimestamp: number;
  public timestampRange: number;

  public serialize(): Buffer {
    const buffer = Buffer.alloc(
      2 + // type
      32 + // chain_hash
      4 + // first_timestamp
      4, // timestamp_range
    ); // prettier-ignore
    const writer = new BufferCursor(buffer);

    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.chainHash);
    writer.writeUInt32BE(this.firstTimestamp);
    writer.writeUInt32BE(this.timestampRange);
    return buffer;
  }
}
