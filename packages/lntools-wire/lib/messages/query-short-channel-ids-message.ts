import { BufferCursor } from "@lntools/buffer-cursor";
import { ShortChannelId } from "../shortchanid";

export class QueryShortChannelIdsMessage {
  public static deserialize(payload: Buffer): QueryShortChannelIdsMessage {
    const reader = new BufferCursor(payload);
    reader.readUInt16BE(); // read off type

    const instance = new QueryShortChannelIdsMessage();
    instance.chainHash = reader.readBytes(32);

    const len = reader.readUInt16BE();

    return instance;
  }

  /**
   * 32-byte chain hash
   */
  public chainHash: Buffer;

  /**
   * List of channels to query
   */
  public shortChannelIds: ShortChannelId[];
}
