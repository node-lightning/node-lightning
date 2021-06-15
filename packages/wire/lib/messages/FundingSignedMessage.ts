import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { ChannelId } from "@node-lightning/core";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";

/**
 * The `funding_signed` message is sent by the channel acceptor after
 * they have recieved a `funding_created` message from the initiator.
 * This message includes the signature for the initiator's first
 * commitment transaction. After the initiator receives this message
 * the channel can be broadcast to the Bitcoin network as both
 * participants can spend the outputs of the funding transaction. This
 * message also is the first instance of the `channel_id` and both sides
 * can transition from using the `temporary_channel_id` to the actual
 * `channel_id`.
 */
export class FundingSignedMessage implements IWireMessage {
    public static type: MessageType = MessageType.FundingSigned;

    /**
     * Deserializes the funding_signed message
     * @param buf
     * @returns
     */
    public static deserialize(buf: Buffer): FundingSignedMessage {
        const instance = new FundingSignedMessage();
        const reader = new BufferReader(buf);

        reader.readUInt16BE(); // read type
        instance.channelId = new ChannelId(reader.readBytes(32));
        instance.signature = reader.readBytes(64);

        return instance;
    }

    /**
     * The type for message. funding_signed = 35
     */
    public readonly type: MessageType = FundingSignedMessage.type;

    /**
     * ChannelId generated from the funding transactions outpoint.
     */
    public channelId: ChannelId;

    /**
     * Signature for the counterpary's first commitment transaction.
     * This signature allows the counterparty to spend the commitment
     * using their own signature. The signature must be 64-bytes
     * representing the 32-byte (r,s) values for an ECDSA signature.
     */
    public signature: Buffer;

    /**
     * Serializes the message into a Buffer
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.channelId.toBuffer());
        writer.writeBytes(this.signature);
        return writer.toBuffer();
    }
}
