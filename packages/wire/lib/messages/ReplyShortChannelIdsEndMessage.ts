import { BufferReader, BufferWriter } from "@lntools/buffer-cursor";
import { MessageType } from "../MessageType";
import { IWireMessage } from "./IWireMessage";

export class ReplyShortChannelIdsEndMessage implements IWireMessage {
    public static deserialize(payload: Buffer): ReplyShortChannelIdsEndMessage {
        const instance = new ReplyShortChannelIdsEndMessage();
        const reader = new BufferReader(payload);

        // read type bytes
        reader.readUInt16BE();

        instance.chainHash = reader.readBytes(32);
        instance.complete = reader.readUInt8() === 1;

        return instance;
    }

    public type: MessageType = MessageType.ReplyShortChannelIdsEnd;
    public chainHash: Buffer;
    public complete: boolean;

    public serialize(): Buffer {
        const len =
            2 + // type
            32 + // chain_hash
            1; // complete

        const writer = new BufferWriter(Buffer.alloc(len));
        writer.writeUInt16BE(this.type);
        writer.writeBytes(this.chainHash);
        writer.writeUInt8(this.complete ? 1 : 0);
        return writer.toBuffer();
    }
}
