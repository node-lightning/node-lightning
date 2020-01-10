import { BufferCursor } from "@lntools/buffer-cursor";
import assert from "assert";
import { ShortChannelId, shortChannelIdFromBuffer } from "../shortchanid";
import { IBufferDeserializable } from "./buffer-deserializable";
import { IBufferSerializable } from "./buffer-serializable";

export class RawEncodedShortIdsSerializer
  implements IBufferSerializable<ShortChannelId[]>, IBufferDeserializable<ShortChannelId[]> {
  public deserialize(buf: Buffer): ShortChannelId[] {
    const reader = new BufferCursor(buf);

    // read off the encoding
    const encoding = reader.readUInt8();

    // read each short channel id from the buffer
    const results: ShortChannelId[] = [];
    while (!reader.eof) {
      results.push(shortChannelIdFromBuffer(reader.readBytes(8)));
    }
    return results;
  }

  public serialize(scids: ShortChannelId[]): Buffer {
    const buf = Buffer.alloc(1 + scids.length * 8);
    const writer = new BufferCursor(buf);

    writer.writeUInt8(0); // encoding of 0
    for (const scid of scids) {
      writer.writeBytes(scid.toBuffer());
    }
    return buf;
  }
}
