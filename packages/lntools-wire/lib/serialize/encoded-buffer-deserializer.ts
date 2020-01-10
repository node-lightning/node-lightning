import { IBufferDeserializable } from "./buffer-deserializable";

/**
 * This class is a generic deserializer for encoded data as specified in BOLT 07.
 * There are two types of encodings that are supported for gossip query looksup,
 * raw data which has an encoding prefix of 0x00 and ZLIB deflate which has a prefix
 * of 0x01.
 *
 * This class accepts two deserializers and based on the encoding type, will use the
 * the correct deserializer.
 *
 * Future note: this class could be improved by accepting a map of encoding types to
 * deserializers
 */
export class EncodedBufferDeserializer<T> implements IBufferDeserializable<T> {
  private _raw: IBufferDeserializable<T>;
  private _zlib: IBufferDeserializable<T>;

  constructor(raw: IBufferDeserializable<T>, zlib: IBufferDeserializable<T>) {
    this._raw = raw;
    this._zlib = zlib;
  }

  public deserialize(buf: Buffer): T {
    const encoding = buf.readUInt8(0);
    if (encoding === 0x00) return this._raw.deserialize(buf);
    else if (encoding === 0x01) return this._zlib.deserialize(buf);
    throw new Error("Unknown encoding type");
  }
}
