import { BufferReader, BufferWriter } from "@lntools/bufio";
import { BitField } from "../BitField";
import { OutPoint } from "../domain/OutPoint";
import { readTlvs } from "../serialize/readTlvs";
import { shortChannelIdFromBuffer } from "../ShortChannelIdUtils";
import { ChannelAnnouncementMessage } from "./ChannelAnnouncementMessage";

/**
 * Decorator for the channel_announcement that includes the additional
 * information provided by the on-chain validation. Specifically, the
 * channel_announcement message only has a short_channel_id with block, tx num,
 * and vout num. We need to obtain the txid as well as the outpoint value to
 * determine the value of the channel.
 *
 * This information is stored in this decorator class which can be broadcast
 * and used downstream by clients that need both sets of information. Additionally
 * the use of this decorator allows us to store the on-chain data along side the
 * channel_announcement data if so desired.
 */
export class ExtendedChannelAnnouncementMessage extends ChannelAnnouncementMessage {
    /**
     * Constructs a new ExtendedChannelAnnouncementMessage from the plain-jane
     * ChannelAnnouncementMessage
     */
    public static fromMessage(msg: ChannelAnnouncementMessage) {
        const instance = new ExtendedChannelAnnouncementMessage();
        instance.bitcoinKey1 = msg.bitcoinKey1;
        instance.bitcoinKey2 = msg.bitcoinKey2;
        instance.bitcoinSignature1 = msg.bitcoinSignature1;
        instance.bitcoinSignature2 = msg.bitcoinSignature2;
        instance.chainHash = msg.chainHash;
        instance.features = msg.features;
        instance.nodeId1 = msg.nodeId1;
        instance.nodeId2 = msg.nodeId2;
        instance.nodeSignature1 = msg.nodeSignature1;
        instance.nodeSignature2 = msg.nodeSignature2;
        instance.shortChannelId = msg.shortChannelId;
        instance.type = msg.type;
        return instance;
    }

    public static deserialize(payload: Buffer): ExtendedChannelAnnouncementMessage {
        const instance = new ExtendedChannelAnnouncementMessage();
        const reader = new BufferReader(payload);
        reader.readUInt16BE(); // read off type

        instance.nodeSignature1 = reader.readBytes(64);
        instance.nodeSignature2 = reader.readBytes(64);
        instance.bitcoinSignature1 = reader.readBytes(64);
        instance.bitcoinSignature2 = reader.readBytes(64);

        const len = reader.readUInt16BE();
        instance.features = BitField.fromBuffer(reader.readBytes(len));
        instance.chainHash = reader.readBytes(32);
        instance.shortChannelId = shortChannelIdFromBuffer(reader.readBytes(8));
        instance.nodeId1 = reader.readBytes(33);
        instance.nodeId2 = reader.readBytes(33);
        instance.bitcoinKey1 = reader.readBytes(33);
        instance.bitcoinKey2 = reader.readBytes(33);

        // read the TLVs for the extended data
        readTlvs(reader, (type: bigint, bytes: Buffer) => {
            switch (type) {
                // process the outpoint which is obtained after looking onchain
                // at the funding transaction. This is encoded as a 32-byte txid
                // and a 2 byte uint output index
                case BigInt(16777271): {
                    const valueReader = new BufferReader(bytes);
                    instance.outpoint = new OutPoint(
                        valueReader.readBytes(32).toString("hex"),
                        valueReader.readTUInt16(),
                    );
                    return true;
                }
                // process the channel capacity which is obtained  after looking
                // onchain at the funding transaction outpoint. This is encoded
                // as a single tuint64 value.
                case BigInt(16777273): {
                    const valueReader = new BufferReader(bytes);
                    instance.capacity = valueReader.readTUInt64();
                    return true;
                }
                default:
                    return false;
            }
        });

        return instance;
    }

    /**
     * OutPoint for the channel that includes the transaction identifier as well
     * as the vout index. This information is obtained by finding the transaction
     * in a block based on the short_channel_id.
     */
    public outpoint: OutPoint;

    /**
     * Capacity of the funding transaction. This information is obtained from on-chain
     * validation of the transaction.
     */
    public capacity: bigint;

    public serialize() {
        const chanAnnBuffer = super.serialize();
        const writer = new BufferWriter();

        // outpoint value
        let valueWriter = new BufferWriter();
        valueWriter.writeBytes(Buffer.from(this.outpoint.txId, "hex"));
        valueWriter.writeTUInt16(this.outpoint.voutIdx);
        let value = valueWriter.toBuffer();

        // outpoint tlv
        writer.writeBigSize(16777271);
        writer.writeBigSize(value.length);
        writer.writeBytes(value);

        // capacity value
        valueWriter = new BufferWriter();
        valueWriter.writeTUInt64(this.capacity);
        value = valueWriter.toBuffer();

        // capacity tlv
        writer.writeBigSize(16777273);
        writer.writeBigSize(value.length);
        writer.writeBytes(value);

        return Buffer.concat([chanAnnBuffer, writer.toBuffer()]);
    }
}
