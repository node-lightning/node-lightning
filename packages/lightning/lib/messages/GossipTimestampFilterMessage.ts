import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";

export class GossipTimestampFilterMessage implements IWireMessage {
    public static deserialize(payload: Buffer): GossipTimestampFilterMessage {
        const instance = new GossipTimestampFilterMessage();
        const reader = new BufferReader(payload);
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
        const len =
            2 + // type
            32 + // chain_hash
            4 + // first_timestamp
            4; // timestamp_range

        const writer = new BufferWriter(Buffer.alloc(len));

        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.chainHash);
        writer.writeUInt32BE(this.firstTimestamp);
        writer.writeUInt32BE(this.timestampRange);
        return writer.toBuffer();
    }
}
