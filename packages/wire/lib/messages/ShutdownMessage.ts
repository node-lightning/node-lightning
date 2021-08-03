import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { MessageType } from "../MessageType";
import { ChannelId } from "@node-lightning/core";
import { IWireMessage } from "./IWireMessage";

/**
 * ShutdownMessage represents the `shutdown` message defined in
 * BOLT #2 of the Lightning Specification. This message can be sent by
 * either node. The scriptPubKey must be a valid P2WPKH, P2WSH, P2SH-P2WPKH, P2SH-P2WSH,
 * or any valid witness script if option_shutdown_anysegwit is negotiated which ensures the
 * resulting transaction will propagate to miners. If shutdown is sent by either node, corresponding
 * node should send commitment_signed to commit any outstanding changes before replying shutdown. Once
 * shutdown is sent by both nodes no new HTLCs should be added or accepted by the channel. After successful
 * handshake of shutdown message, fee negotiation and signature sending can begin with `closing_signed` message.
 */

export class ShutdownMessage implements IWireMessage {
    public static type = MessageType.Shutdown;

    /**
     * Deserializes a shutdown message
     * @param buf
     */
    public static deserialize(buf: Buffer): ShutdownMessage {
        const instance = new ShutdownMessage();
        const reader = new BufferReader(buf);

        reader.readUInt16BE(); // read type
        instance.channelId = new ChannelId(reader.readBytes(32));
        instance.len = reader.readUInt16BE();
        instance.scriptPubKey = reader.readBytes(instance.len);

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

    public len: number;
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
        writer.writeUInt16BE(this.len);
        writer.writeBytes(this.scriptPubKey);
        return writer.toBuffer();
    }
}
