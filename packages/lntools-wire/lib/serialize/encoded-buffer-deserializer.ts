import { IBufferDeserializable } from "./buffer-deserializable";

export class EncodedBufferDeserializer<T> implements IBufferDeserializable<T> {
  private _raw: IBufferDeserializable<T>;
  private _zlib: IBufferDeserializable<T>;

  constructor(raw: IBufferDeserializable<T>, zlib: IBufferDeserializable<T>) {
    this._raw = raw;
    this._zlib = zlib;
  }

  public deserialize(buf: Buffer): T {
    const encoding = buf.readUInt8(0);
    console.log("encoded-buffer-deserialize", buf.length, encoding);
    if (encoding === 0x00) return this._raw.deserialize(buf);
    else if (encoding === 0x01) return this._zlib.deserialize(buf);
    throw new Error("Unknown encoding type");
  }
}
