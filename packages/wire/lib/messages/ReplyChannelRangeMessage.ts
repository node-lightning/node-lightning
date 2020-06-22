import { BufferReader, BufferWriter } from "@lntools/bufio";
import { MessageType } from "../MessageType";
import { Encoder } from "../serialize/Encoder";
import { EncodingType } from "../serialize/EncodingType";
import { readTlvs } from "../serialize/readTlvs";
import { ShortChannelId } from "../ShortChannelId";
import { shortChannelIdFromBuffer } from "../ShortChannelIdUtils";
import { IWireMessage } from "./IWireMessage";

export class ReplyChannelRangeMessage implements IWireMessage {
    public static deserialize(payload: Buffer): ReplyChannelRangeMessage {
        const instance = new ReplyChannelRangeMessage();
        const reader = new BufferReader(payload);

        // read type bytes
        reader.readUInt16BE();

        instance.chainHash = reader.readBytes(32);

        instance.firstBlocknum = reader.readUInt32BE();
        instance.numberOfBlocks = reader.readUInt32BE();
        instance.fullInformation = reader.readUInt8() === 1;

        // read encoded_short_ids
        const encodedLen = reader.readUInt16BE(); // encoded_short_channel_id bytes
        const encodedScidBytes = reader.readBytes(encodedLen);
        const scidsBytes = new Encoder().decode(encodedScidBytes);
        const scidsReader = new BufferReader(scidsBytes);
        while (!scidsReader.eof) {
            const scidBytes = scidsReader.readBytes(8);
            instance.shortChannelIds.push(shortChannelIdFromBuffer(scidBytes));
        }

        // read tlvs in the reply_channel_range realm
        readTlvs(reader, (type: bigint, valueReader: BufferReader) => {
            switch (type) {
                // timestamps TLVs include the timestamps for the node1/2
                // node_update messages. A tuple [number, number] will be
                // returned for each short_channel_id that is returned.
                // Timestamps are an encoded field where the first byte
                // indicates the encoding type (RAW or ZLIB DEFLATE).
                case BigInt(1): {
                    const bytes = valueReader.readBytes();
                    const decodedBytes = new Encoder().decode(bytes);
                    const decodedReader = new BufferReader(decodedBytes);
                    while (!decodedReader.eof) {
                        instance.timestamps.push([
                            decodedReader.readUInt32BE(),
                            decodedReader.readUInt32BE(),
                        ]);
                    }
                    return true;
                }

                // checksum TLVs include the checksums for the node1/2
                // node_update message. A tuple [number, number] will be
                // returned for each short_channel_id that is returned
                case BigInt(3): {
                    while (!valueReader.eof) {
                        instance.checksums.push([
                            valueReader.readUInt32BE(),
                            valueReader.readUInt32BE(),
                        ]);
                    }
                    return true;
                }

                // return that the TLV type was not handled
                default:
                    return false;
            }
        });

        return instance;
    }

    public type: MessageType = MessageType.ReplyChannelRange;
    public chainHash: Buffer;
    public firstBlocknum: number;
    public numberOfBlocks: number;
    public fullInformation: boolean;
    public shortChannelIds: ShortChannelId[] = [];
    public timestamps: Array<[number, number]> = [];
    public checksums: Array<[number, number]> = [];

    public serialize(encoding: EncodingType = EncodingType.ZlibDeflate): Buffer {
        // encode short channel ids
        const rawSids = Buffer.concat(this.shortChannelIds.map(p => p.toBuffer()));
        const esids = new Encoder().encode(encoding, rawSids);

        const writer = new BufferWriter();
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.chainHash);
        writer.writeUInt32BE(this.firstBlocknum);
        writer.writeUInt32BE(this.numberOfBlocks);
        writer.writeUInt8(this.fullInformation ? 1 : 0);
        writer.writeUInt16BE(esids.length);
        writer.writeBytes(esids);

        // write timestamp TLV if it is required. The timestaps are encoded as
        // uint32BE tuples corresponding to the timestamps for node1/2
        // channel_update messages. This buffer uses the encoding format
        // supplied and will be either RAW or ZLIB DEFLARE
        if (this.timestamps.length) {
            const valueWriter = new BufferWriter();
            for (const [v1, v2] of this.timestamps) {
                valueWriter.writeUInt32BE(v1);
                valueWriter.writeUInt32BE(v2);
            }
            const value = new Encoder().encode(encoding, valueWriter.toBuffer());
            writer.writeBigSize(BigInt(1)); // type
            writer.writeBigSize(BigInt(value.length)); // length
            writer.writeBytes(value); // value
        }

        // write checksums TLV if it is required. The checksums are encoded as
        // uint32BE tuples corresponding to the checksums for node1/2
        // channel_update messages
        if (this.checksums.length) {
            const valueWriter = new BufferWriter();
            for (const [v1, v2] of this.checksums) {
                valueWriter.writeUInt32BE(v1);
                valueWriter.writeUInt32BE(v2);
            }
            const value = valueWriter.toBuffer();
            writer.writeBigSize(BigInt(3)); // type
            writer.writeBigSize(BigInt(value.length)); // length
            writer.writeBytes(value); // value
        }

        return writer.toBuffer();
    }
}
