import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { ShortChannelId } from "@node-lightning/core";
import { shortChannelIdFromBuffer } from "@node-lightning/core";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";

/**
 * This is a direct messagee between two endpoints of a channel
 * and serves as an opt-in mechanism to allow the
 * announcement of the channel to the rest of the network. It
 * contains the necessary signatuures, by the sender, to construct
 * the channel_announcement message.
 *
 * The message constructed by constructing a channel_announcement
 * message, corresponding to the newly created channel, and signing
 * it with the secrets matching an endpoint's node_id and
 * bitcoin_key.
 */
export class AnnouncementSignaturesMessage implements IWireMessage {
    /**
     * Deserializes a Buffer into an AnnouncementSignaturesMessage.
     */
    public static deserialize(payload: Buffer): AnnouncementSignaturesMessage {
        const reader = new BufferReader(payload);
        reader.readUInt16BE(); // read off type

        const instance = new AnnouncementSignaturesMessage();
        instance.channelId = reader.readBytes(32);
        instance.shortChannelId = shortChannelIdFromBuffer(reader.readBytes(8));
        instance.nodeSignature = reader.readBytes(64);
        instance.bitcoinSignature = reader.readBytes(64);
        return instance;
    }

    /**
     * Message type - 259
     */
    public type: MessageType = MessageType.AnnouncementSignatures;

    /**
     * Buffer of the channel_id for the message.
     */
    public channelId: Buffer = Buffer.alloc(0);

    /**
     * ShortChannelId is a unique reference to the funding output of
     * the channel.
     */
    public shortChannelId: ShortChannelId;

    /**
     * Buffer containing the signature of the channel_announcement message
     * signed by the endpoint's node_id.
     */
    public nodeSignature: Buffer = Buffer.alloc(0);

    /**
     * Buffer containing the signaturee of the channel_announcment message
     * signed by the endpoint's bitcoin_key.
     */
    public bitcoinSignature: Buffer = Buffer.alloc(0);

    /**
     * Serializes the instance into a Buffer suitable for
     * transmission on the wire.
     */
    public serialize(): Buffer {
        const len =
            2 + // type
            32 + // channel_id
            8 + // short_channel_id
            64 + // node_signature
            64; // bitcoin_signaturee
        const writer = new BufferWriter(Buffer.alloc(len));
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.channelId);
        writer.writeBytes(this.shortChannelId.toBuffer());
        writer.writeBytes(this.nodeSignature);
        writer.writeBytes(this.bitcoinSignature);
        return writer.toBuffer();
    }
}
