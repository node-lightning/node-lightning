import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { ChannelId } from "../domain/ChannelId";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";

/**
 * This message is sent by both participants in the channel after
 * the funding transaction has reached a sufficient depth (as specified
 * in `accept_channel` via the `minimum_depth` property). This message
 * enables normal operation for the channel by providing the
 * next `per_commitment_point` needed to generate a new commitment
 * transaction signature. This message may get resent upon reconnections
 * if no additional updates have occurred for the channel.
 */
export class FundingLockedMessage implements IWireMessage {
    public static type: MessageType = MessageType.FundingLocked;

    /**
     * Deserializes the `funding_signed` message per BOLT2
     */
    public static deserialize(buf: Buffer): FundingLockedMessage {
        const instance = new FundingLockedMessage();
        const reader = new BufferReader(buf);

        reader.readUInt16BE(); // read type
        instance.channelId = new ChannelId(reader.readBytes(32));
        instance.nextPerCommitmentPoint = reader.readBytes(33);

        return instance;
    }

    /**
     * The type for message. funding_signed = 35
     */
    public readonly type: MessageType = FundingLockedMessage.type;

    /**
     * Unique channel identifier for the channel based on the funding
     * transactions UTXO.
     */
    public channelId: ChannelId;

    /**
     * Provides the next_per_commitment_point that the peer should use
     * for the next commitment transaction. For this message, this is
     * the commitment transaction in the first update.
     */
    public nextPerCommitmentPoint: Buffer;

    /**
     * Serializes the `funding_locked` message per BOLT2
     * @returns
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.channelId.toBuffer());
        writer.writeBytes(this.nextPerCommitmentPoint);
        return writer.toBuffer();
    }
}
