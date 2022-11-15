import { BufferReader, BufferWriter } from "@node-lightning/bufio";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";

export class PongMessage implements IWireMessage {
    /**
     * Deserializes a pong message from a Buffer into a PongMessage
     * instance.
     */
    public static deserialize(payload: Buffer): PongMessage {
        const instance = new PongMessage();

        const reader = new BufferReader(payload);
        reader.readUInt16BE(); // read off type

        const byteslen = reader.readUInt16BE();
        instance.ignored = reader.readBytes(byteslen);
        return instance;
    }

    /**
     * Message type = 19
     */
    public type: MessageType = MessageType.Pong;

    /**
     * Should be set to zeros of length specified in a ping message's
     * num_pong_bytes. Must not set ignored to sensitive data such as
     * secrets or portions of initialized memory.
     */
    public ignored: Buffer;

    /**
     * In order to allow for the existence of long-lived TCP
     * connections, at times it may be required that both ends keep
     * alive the TCP connection at the application level.
     *
     * The pong message is a reply to a ping message and must
     * reply with the specify number of bytes when the num_pong_bytes
     * value is less than 65532.
     * for the number of pong bytes it expects to receive as
     * a reply. The ignored bits should be set to 0.
     */
    constructor(numPongBytes = 0) {
        this.ignored = Buffer.alloc(numPongBytes);
    }

    /**
     * Serializes a PongMessage into a Buffer that can be
     * streamed on the wire.
     */
    public serialize(): Buffer {
        const len =
            2 + // type
            2 + // byteslen
            +this.ignored.length;

        const writer = new BufferWriter(Buffer.alloc(len));
        writer.writeUInt16BE(this.type);
        writer.writeUInt16BE(this.ignored.length);
        writer.writeBytes(this.ignored);
        return writer.toBuffer();
    }
}
