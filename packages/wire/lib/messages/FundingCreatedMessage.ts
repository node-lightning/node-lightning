import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";

/**
 * The `funding_created` message is sent by the channel initiator after
 * the channel has been accepted with `accept_channel`. The channel
 * initiator includes the outpoint for the funding transaction as well
 * as their signature for the counter-parties first commitment
 * transaction. This message provides the channel acceptor the
 * information they need to sign the initiator's first commitment
 * transaction in the next message: `funding_signed`.
 */
export class FundingCreatedMessage implements IWireMessage {
    public static type = MessageType.FundingCreated;

    /**
     * Deserializes an funding_created message
     * @param buf
     */
    public static deserialize(buf: Buffer): FundingCreatedMessage {
        const instance = new FundingCreatedMessage();
        const reader = new BufferReader(buf);

        reader.readUInt16BE(); // read type
        instance.temporaryChannelId = reader.readBytes(32);
        instance.fundingTxId = reader.readBytes(32);
        instance.fundingOutputIndex = reader.readUInt16BE();
        instance.signature = reader.readBytes(64);

        return instance;
    }

    /**
     * The type for message. funding_created = 34
     */
    public type = FundingCreatedMessage.type;

    /**
     * A unique and temporary identifier used during the channel creation
     * process. This value is a placeholder for the channel_id that is
     * created from the funding transaction that can be used after the
     * funding_created message creates this transaction and the
     * counterparty uses the channel_id in the funding_signed message.
     */
    public temporaryChannelId: Buffer;

    /**
     * Transaction identifier for the funding transaction as represented
     * as a sha256 hash of the serialized funding transaction. This
     * value uses internal or natural byte order. Transaction identifiers
     * often are in RPC or reversed byte order.
     */
    public fundingTxId: Buffer;

    /**
     * Output index for the transaction which should be between 0 and
     * 65535 u16 value.
     */
    public fundingOutputIndex: number;

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
        writer.writeBytes(this.temporaryChannelId);
        writer.writeBytes(this.fundingTxId);
        writer.writeUInt16BE(this.fundingOutputIndex);
        writer.writeBytes(this.signature);
        return writer.toBuffer();
    }
}
