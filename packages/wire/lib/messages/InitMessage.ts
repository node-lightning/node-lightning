import { BufferCursor } from "@lntools/buffer-cursor";
import { BitField } from "../BitField";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";
import { TlvValueReader } from "../serialize/TlvValueReader";

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
        const reader = new BufferCursor(buffer);

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
        while (!reader.eof) {
            const type = reader.readBigSize();
            const length = reader.readBigSize();
            const value = reader.readBytes(Number(length));
            const valueReader = new BufferCursor(value);

            switch (Number(type)) {
                // networks
                case 1: {
                    while (!valueReader.eof) {
                        const chainHash = valueReader.readBytes(32);
                        instance.chainHashes.push(chainHash);
                    }
                    break;
                }
            }
        }

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
        const gflen = 0;
        const features = this.features.toBuffer();
        const featuresLen = features.length;

        const hasChainHashTlv = this.chainHashes.length;
        const chainHashesLen = this.chainHashes.length * 32;
        const chainHashTlvLen = hasChainHashTlv
            ? chainHashesLen +
              BufferCursor.bigSizeBytes(1n) +
              BufferCursor.bigSizeBytes(BigInt(chainHashesLen))
            : 0;

        // create a Buffer of the correct length that will
        // be returned after all data is written to the buffer.
        const buffer = Buffer.alloc(
            2 + // type (uint16be)
            2 + // length of glfen (uint16be)
            0 + // length of global features
            2 + // length of lflen (uint16be)
            featuresLen + // length of features
            chainHashTlvLen
        ); // prettier-ignore

        // use BufferCursor to make writing easier
        const cursor = new BufferCursor(buffer);

        // write the type
        cursor.writeUInt16BE(this.type);

        // write gflen
        cursor.writeUInt16BE(gflen);

        // write lflen
        cursor.writeUInt16BE(featuresLen);

        // write lf
        cursor.writeBytes(features);

        // write chainhash tlv
        if (hasChainHashTlv) {
            cursor.writeBigSize(1n); // type
            cursor.writeBigSize(BigInt(chainHashesLen)); // length
            cursor.writeBytes(Buffer.concat(this.chainHashes)); // value
        }

        return buffer;
    }
}
