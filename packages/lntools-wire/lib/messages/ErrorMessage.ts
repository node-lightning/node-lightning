import { BufferCursor } from "@lntools/buffer-cursor";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";

/**
 * This message is defined in BOLT #1 and is used for telling
 * a peer that something is incorrect. The message can indicate
 * which channel is in error, or if channelId is 0, it refers
 * to all channels.
 *
 * These message can indicate protocol violations or internal
 * errors that make channels unusable or that make further
 * communication unusable.
 */
export class ErrorMessage implements IWireMessage {
    /**
     * Deserializes an error message into an ErrorMessage
     * instance.
     */
    public static deserialize(payload: Buffer): ErrorMessage {
        const reader = new BufferCursor(payload);
        reader.readUInt16BE(); // read type

        const instance = new ErrorMessage();
        instance.channelId = reader.readUInt32BE();

        const len = reader.readUInt16BE();
        instance.data = reader.readBytes(len);

        return instance;
    }

    /**
     * Message type 17
     */
    public type: MessageType = MessageType.Error;

    /**
     * channelId is used to indicate the failing channel. It
     * can have a value of 0 to indicate there is an error with
     * all channels.
     *
     * All error messsagees sent before (and including) the
     * funding_created messagee should use the temporary_channel_id
     * instead of the channel_id.
     */
    public channelId: any = 0;

    /**
     * Data field may be empty. May contain the raw, hex-encoded
     * transaction in reply to a invalid signature check in
     * funding_created, funding_signed, closing_signed, or
     * commitment_signed messages.
     */
    public data: Buffer = Buffer.alloc(0);

    /**
     * Serialize the ErorrMessage into a Buffer that
     * can be send on the wire.
     */
    public serialize(): Buffer {
        const buffer = Buffer.alloc(
            2 + // type
            4 + // channel_id
            2 + // len
                this.data.length,
        );
        const writer = new BufferCursor(buffer);
        writer.writeUInt16BE(this.type);
        writer.writeUInt32BE(this.channelId);
        writer.writeUInt16BE(this.data.length);
        writer.writeBytes(this.data);
        return buffer;
    }
}
