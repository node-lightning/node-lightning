import { BufferReader, BufferWriter } from "@lntools/bufio";
import { BitField } from "../BitField";
import { QueryChannelRangeFlags } from "../flags/QueryChannelRangeFlags";
import { MessageType } from "../MessageType";
import { readTlvs } from "../serialize/readTlvs";
import { IWireMessage } from "./IWireMessage";

export class QueryChannelRangeMessage implements IWireMessage {
    public static deserialize(payload: Buffer): QueryChannelRangeMessage {
        const instance = new QueryChannelRangeMessage();
        const reader = new BufferReader(payload);

        reader.readUInt16BE(); // read type bytes
        instance.chainHash = reader.readBytes(32);
        instance.firstBlocknum = reader.readUInt32BE();
        instance.numberOfBlocks = reader.readUInt32BE();

        // Parse any TLVs that might exist
        readTlvs(reader, (type: bigint, valueReader: BufferReader) => {
            switch (type) {
                case BigInt(1): {
                    const options = valueReader.readBigSize();
                    const bitfield = new BitField<QueryChannelRangeFlags>(options);
                    instance.timestamps = bitfield.isSet(QueryChannelRangeFlags.timestamps);
                    instance.checksums = bitfield.isSet(QueryChannelRangeFlags.checksums);
                    return true;
                }
                default:
                    return false;
            }
        });

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
     * When gossip_queries_ex is enabled, this asks the remote node to include
     * the timestamps of update messages.
     */
    public timestamps: boolean;

    /**
     * When gossip_queries_ex is enabled, this asks the remote node to include
     * checksums of update messages.
     */
    public checksums: boolean;

    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeUInt16BE(MessageType.QueryChannelRange);
        writer.writeBytes(this.chainHash);
        writer.writeUInt32BE(this.firstBlocknum);
        writer.writeUInt32BE(this.numberOfBlocks);

        // write the options TLV
        if (this.timestamps || this.checksums) {
            const bitfield = new BitField<QueryChannelRangeFlags>();
            if (this.timestamps) bitfield.set(QueryChannelRangeFlags.timestamps);
            if (this.checksums) bitfield.set(QueryChannelRangeFlags.checksums);
            writer.writeBigSize(BigInt(1));
            writer.writeBigSize(BigInt(BufferReader.bigSizeBytes(bitfield.value)));
            writer.writeBigSize(bitfield.value);
        }

        return writer.toBuffer();
    }
}
