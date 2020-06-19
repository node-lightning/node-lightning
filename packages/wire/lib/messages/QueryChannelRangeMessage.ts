import { BufferReader, BufferWriter } from "@lntools/bufio";
import { MessageType } from "../MessageType";
import { TlvStreamReader } from "../serialize/TlvStreamReader";
import { IWireMessage } from "./IWireMessage";
import { QueryChannelRangeOptions } from "./tlvs/QueryChannelRangeOptions";

export class QueryChannelRangeMessage implements IWireMessage {
    public static deserialize(payload: Buffer): QueryChannelRangeMessage {
        const instance = new QueryChannelRangeMessage();
        const reader = new BufferReader(payload);

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
    public type: MessageType = MessageType.QueryChannelRange;

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
        const len =
            2 + // type
            32 + // chain_hash
            4 + // first_blocknum
            4 + // number_of_blocks
            optionsBuffer.length; // options tlv

        const writer = new BufferWriter(Buffer.alloc(len));
        writer.writeUInt16BE(MessageType.QueryChannelRange);
        writer.writeBytes(this.chainHash);
        writer.writeUInt32BE(this.firstBlocknum);
        writer.writeUInt32BE(this.numberOfBlocks);
        if (this.options) {
            writer.writeBytes(optionsBuffer);
        }
        return writer.toBuffer();
    }
}
