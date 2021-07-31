import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { MessageType } from "../MessageType";
import { ChannelId } from "@node-lightning/core";
import { IWireMessage } from "./IWireMessage";

/**
 * ShutdownMessage represents the `shutdown` message defined in
 * BOLT #2 of the Lightning Specification. This message can be sent by the
 * either node. The scriptPubKey must follow the standards which are accepted
 * by Bitcoin network that ensures the resulting transaction will propagate
 * to miners. If shutdown is sent by either node , corresponding node should send
 * commitment_signed to commit any outstanding changes before replying shutdown. Once
 * shutdown is sent by both nodes no new HTLCs should be added or accepted by the channel.
 */

export class ShutdownMessage implements IWireMessage {
    public static type = MessageType.CloseChannel;

    /**
     * Deserializes an open_channel message
     * @param buf
     */
    public static deserialize(buf: Buffer): ShutdownMessage {
        const instance = new ShutdownMessage();
        const reader = new BufferReader(buf);

        reader.readUInt16BE(); // read type
        instance.channelId = new ChannelId(reader.readBytes(32));
        instance.len = reader.readBytes(16);
        instance.scriptPubKey = reader.readBytes();

        return instance;
    }

    /**
     * The type for message. Shutdown = 38
     */
    public readonly type: MessageType = ShutdownMessage.type;

    /**
     * ChannelId generated from the funding transactions outpoint.
     */
    public channelId: ChannelId;

    public len: Buffer;

    /**
     * scriptPubKey is used by the sender to get paid.
     */
    public scriptPubKey: Buffer;

    /**
     * Serializes the message into a Buffer
     */
    public serialize(): Buffer {
        const writer = new BufferWriter();
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.channelId.toBuffer());
        writer.writeBytes(this.len);
        writer.writeBytes(this.scriptPubKey);
        return writer.toBuffer();
    }
}
