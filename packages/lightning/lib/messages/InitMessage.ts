import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { BitField } from "../BitField";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";
import { MessageType } from "../MessageType";
import { readTlvs } from "../serialize/readTlvs";
import { IWireMessage } from "./IWireMessage";

/**
 * InitMessage is defined in BOLT #1. Once authentication is complete, the first
 * message reveals the features supported or required by the node sending the
 * message. This message is sent even on a reconnection.
 *
 * This message contains two fields; global features and local features, that
 * are used to signal how the message should operate. The values of are defined
 * in the BOLT #9.
 */
export class InitMessage implements IWireMessage {
    /**
     * Processes a buffer containing the message information. This method
     * will capture the arbitrary length global and local
     * features into two internal properties of the newly constructed
     * init message object.
     */
    public static deserialize(buffer: Buffer): InitMessage {
        const instance = new InitMessage();
        const reader = new BufferReader(buffer);

        // read the type bytes
        reader.readUInt16BE();

        // read the global features and per the specification, the global
        // features should not exceed features greater than 13.
        const gflen = reader.readUInt16BE();
        const gf = BitField.fromBuffer(reader.readBytes(gflen));

        // Read the local length and parse into a BN value.
        const lflen = reader.readUInt16BE();
        const lf = BitField.fromBuffer(reader.readBytes(lflen));

        // construct a single features object by bitwise or of the global and
        // local features.
        instance.features = new BitField().or(gf).or(lf);

        // process TLVs
        readTlvs(reader, (type: bigint, valueReader: BufferReader) => {
            switch (type) {
                // Process networks TLVs which is a series of chain_hash 32
                // byte values. This method will simply read from the stream
                // until every thing has been read
                case BigInt(1): {
                    while (!valueReader.eof) {
                        const chainHash = valueReader.readBytes(32);
                        instance.chainHashes.push(chainHash);
                    }
                    return true;
                }
            }
        });

        return instance;
    }

    /**
     * Message type 16
     */
    public type: MessageType = MessageType.Init;

    /**
     * BitField containing the features provided in by the local or remote node
     */
    public features: BitField<InitFeatureFlags> = new BitField();

    /**
     * Supported chain_hashes for the remote peer
     */
    public chainHashes: Buffer[] = [];

    /**
     * Serialize will construct a properly formatted message based on the
     * properties of the configured message.
     */
    public serialize() {
        const writer = new BufferWriter();

        // write the type
        writer.writeUInt16BE(this.type);

        // write gflen
        const gflen = 0;
        writer.writeUInt16BE(gflen);

        // write features
        const features = this.features.toBuffer();
        const featuresLen = features.length;
        writer.writeUInt16BE(featuresLen);
        writer.writeBytes(features);

        // write chainhash tlv
        if (this.chainHashes.length) {
            writer.writeBigSize(1); // type
            writer.writeBigSize(this.chainHashes.length * 32); // length
            writer.writeBytes(Buffer.concat(this.chainHashes)); // value
        }

        return writer.toBuffer();
    }
}
