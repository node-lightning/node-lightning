import { BufferCursor } from "@lntools/buffer-cursor";
import { MESSAGE_TYPE } from "../message-type";
import { ShortChannelId, shortChannelIdFromBuffer } from "../shortchanid";
import { IWireMessage } from "./wire-message";

export class ReplyShortChannelIdsEndMessage implements IWireMessage {
  public static deserialize(payload: Buffer): ReplyShortChannelIdsEndMessage {
    const instance = new ReplyShortChannelIdsEndMessage();
    const reader = new BufferCursor(payload);

    // read type bytes
    reader.readUInt16BE();

    instance.chainHash = reader.readBytes(32);
    instance.complete = reader.readUInt8() === 1;

    return instance;
  }

  public type: MESSAGE_TYPE = MESSAGE_TYPE.REPLY_SHORT_CHANNEL_IDS_END;
  public chainHash: Buffer;
  public complete: boolean;

  public serialize(): Buffer {
    const buffer = Buffer.alloc(
      2 + // type
      32 + // chain_hash
      1, // complete
    ); // prettier-ignore
    const writer = new BufferCursor(buffer);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.chainHash);
    writer.writeUInt8(this.complete ? 1 : 0);
    return buffer;
  }
}
