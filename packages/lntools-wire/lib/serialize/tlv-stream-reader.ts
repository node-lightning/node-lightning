import { BufferCursor } from "@lntools/buffer-cursor";
import { ITlvDeserializable } from "./tlv-deserializable";

export class TlvStreamReader {
  private _deserializers: Map<bigint, ITlvDeserializable<any>> = new Map();

  public register(type: ITlvDeserializable<any>) {
    this._deserializers.set(type.type, type);
  }

  public read(reader: BufferCursor): any[] {
    const results = [];
    while (!reader.eof) {
      const result = this.readRecord(reader);
      if (result) results.push(result);
    }
    return results;
  }

  public readRecord(reader: BufferCursor): any {
    if (reader.eof) return;

    const type = reader.readBigSize();
    if (type === BigInt(0)) return;

    const len = reader.readBigSize();
    const bytes = reader.readBytes(Number(len));

    const deserType = this._deserializers.get(type);
    if (deserType) {
      if (bytes.length) return deserType.deserialize(bytes);
      else return new deserType();
    } else if (type % BigInt(2) === BigInt(0)) {
      throw new Error("Unknown even type");
    }
  }
}
