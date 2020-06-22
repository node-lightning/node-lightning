import { BufferReader, BufferWriter } from "@lntools/bufio";
import { BitField } from "../BitField";
import { QueryScidFlags } from "../flags/QueryScidFlags";
import { MessageType } from "../MessageType";
import { Encoder } from "../serialize/Encoder";
import { EncodingType } from "../serialize/EncodingType";
import { readTlvs } from "../serialize/readTlvs";
import { ShortChannelId } from "../ShortChannelId";
import { shortChannelIdFromBuffer } from "../ShortChannelIdUtils";
import { IWireMessage } from "./IWireMessage";

export class QueryShortChannelIdsMessage implements IWireMessage {
    public static deserialize(payload: Buffer): QueryShortChannelIdsMessage {
        const instance = new QueryShortChannelIdsMessage();
        const reader = new BufferReader(payload);

        reader.readUInt16BE(); // read off type
        instance.chainHash = reader.readBytes(32); // chain_hash

        // process the encoded short channel ids by reading the length of
        // encoded data, then using the decoder to get the raw buffer after
        // using the appropriate decoding scheme
        const encodedScidLen = reader.readUInt16BE();
        const encodedScidBuffer = reader.readBytes(encodedScidLen);
        const scidBuffer = new Encoder().decode(encodedScidBuffer);

        // After we have a raw buffer of scid values (each 8 bytes) we can read
        // the data from the buffer
        const scidReader = new BufferReader(scidBuffer);
        while (!scidReader.eof) {
            const scid = shortChannelIdFromBuffer(scidReader.readBytes(8));
            instance.shortChannelIds.push(scid);
        }

        // Process all TLVs available on the reader
        readTlvs(reader, (type: bigint, valueReader: BufferReader) => {
            switch (type) {
                case BigInt(1): {
                    const bytes = valueReader.readBytes();
                    const flagBytes = new Encoder().decode(bytes);
                    const flagReader = new BufferReader(flagBytes);
                    while (!flagReader.eof) {
                        const rawFlags = flagReader.readBigSize();
                        const flags = new BitField<QueryScidFlags>(rawFlags);
                        instance.flags.push(flags);
                    }
                    return true;
                }
                default:
                    return false;
            }
        });

        return instance;
    }

    /**
     * Type 261
     */
    public type: MessageType = MessageType.QueryShortChannelIds;

    /**
     * 32-byte chain hash
     */
    public chainHash: Buffer;

    /**
     * List of channels to query
     */
    public shortChannelIds: ShortChannelId[] = [];

    /**
     * Optional flags that can be set when gossip_queries_ex is enabled.
     */
    public flags: Array<BitField<QueryScidFlags>> = [];

    public serialize(encoding: EncodingType = EncodingType.ZlibDeflate): Buffer {
        const rawIdsBuffer = Buffer.concat(this.shortChannelIds.map(p => p.toBuffer()));
        const esids = new Encoder().encode(encoding, rawIdsBuffer);

        const writer = new BufferWriter();
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.chainHash);
        writer.writeUInt16BE(esids.length);
        writer.writeBytes(esids);

        // encode TLV 1
        if (this.flags.length) {
            // combine all BitFields into buffers
            const flagBufs: Buffer[] = [];
            for (const flag of this.flags) {
                flagBufs.push(flag.toBuffer());
            }
            const flagBytes = Buffer.concat(flagBufs);

            // encode the flag bytes according to the encoding strategy
            const encodedFlagBytes = new Encoder().encode(encoding, flagBytes);

            // write TLV data
            writer.writeBigSize(1);
            writer.writeBigSize(encodedFlagBytes.length);
            writer.writeBytes(encodedFlagBytes);
        }

        return writer.toBuffer();
    }
}
