import { ShortChannelId } from "../shortchanid";
import { IBufferSerializable } from "./buffer-serializable";

export class RawEncodedShortIdsSerializer implements IBufferSerializable<ShortChannelId[]> {
  public serialize(scids: ShortChannelId[]): Buffer {
    const encoding = Buffer.alloc(1); // 00 is the encoding
    return Buffer.concat([encoding, ...scids.map(scid => scid.toBuffer())]);
  }
}
