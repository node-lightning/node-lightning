import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { ChannelId, Value } from "@node-lightning/core";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";

/**
 * The `closing_signed` message is sent by the channel funder after
 * the `shutdown_message`. The funder chooses a fee it thinks
 * is fair, and signs the closing transaction with the scriptpubkey fields from
 * the shutdown messages (along with its chosen fee) and sends the signature.
 * The other node then replies similarly, using a fee it thinks is fair.
 * One of the benefits of mutual close is that the fee rate can be negotiated
 * down from the existing fee rate(which is generally expensive) to a more reasonable one.
 * In order for fee rate to converge, it has to be strictly between the last proposed
 * and the counterparty's last proposed value. This exchange continues using the
 * channelID until both agree on the same fee or when one side fails the channel.
 */
export class ClosingSignedMessage implements IWireMessage {
    public static type: MessageType = MessageType.ClosingSigned;

    /**
     * Deserializes the closing_signed message
     * @param buf
     * @returns
     */
    public static deserialize(buf: Buffer): ClosingSignedMessage {
        const instance = new ClosingSignedMessage();
        const reader = new BufferReader(buf);

        reader.readUInt16BE(); // read type
        instance.channelId = new ChannelId(reader.readBytes(32));
        instance.feeSatoshis = Value.fromSats(reader.readUInt64BE());
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
     * Expected value for fee_satoshis could vary how fee rate negotiations happens between the
     * two nodes.Assuming initially both nodes have different fee estimates, in every iteration
     * they should ensure fee rate is strictly between their last proposed and the counterparty's
     * last proposed value. Hence changes are made accordingly on both ends and communicated
     * between the channel until both of them comes to an agreement or when one side fails the
     * channel.
     */
    public feeSatoshis: Value;

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
        writer.writeUInt64BE(this.feeSatoshis.sats);
        writer.writeBytes(this.signature);
        return writer.toBuffer();
    }
}
