import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { ChannelId } from "@node-lightning/core";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";


/**
 */
export class ClosingSignedMessage implements IWireMessage {
    public static type: MessageType = MessageType.ClosingSigned;

    /**
     * Deserializes the funding_signed message
     * @param buf
     * @returns
     */
    public static deserialize(buf: Buffer): ClosingSignedMessage {
        const instance = new ClosingSignedMessage();
        const reader = new BufferReader(buf);

        reader.readUInt16BE(); // read type
        instance.channelId = new ChannelId(reader.readBytes(32));
        instance.feeSatoshis = reader.readUInt64BE();
        instance.signature = reader.readBytes(64);

        return instance;
    }

    /**
     * The type for message. Closing_Signed = 39
     */
    public readonly type: MessageType = ClosingSignedMessage.type;

    /**
     * ChannelId generated from the funding transactions outpoint.
     */
    public channelId: ChannelId;

    /**
     * fee_satoshis is set according to its estimate of cost of inclusion in a block.
     */
    public feeSatoshis: bigint;

    /**
     * Sender signs the closing transaction with the scriptpubkey fields from the 
     * shutdown messages (along with its chosen fee) and sends the signature;
     */
    public signature: Buffer;

    /**
     * Serializes the message into a Buffer
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.channelId.toBuffer());
        writer.writeUInt64BE(this.feeSatoshis);
        writer.writeBytes(this.signature);
        return writer.toBuffer();
    }
}
