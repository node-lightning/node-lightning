import { ShortChannelId } from "../shortchanid";
import { IBufferSerializable } from "./buffer-serializable";
import { RawEncodedShortIdsSerializer } from "./raw-encoded-short-ids-serializer";
import { ZlibEncoder } from "./zlib-encoder";

/**
 * Serializes an array of ShortChannelIds using the Zlib deflate
 * encoding type. When serialized the encoded_short_ids is
 * prefixed with 0x01 to indicate that it is compressed with Zlib
 * deflate
 */
export class ZlibEncodedShortIdsSerializer implements IBufferSerializable<ShortChannelId[]> {
  public serialize(scids: ShortChannelId[]): Buffer {
    const raw = new RawEncodedShortIdsSerializer().serialize(scids).slice(1);
    const encoding = Buffer.from([1]);
    const encoded = new ZlibEncoder().encode(raw);
    return Buffer.concat([encoding, encoded]);
  }
}
