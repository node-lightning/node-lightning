import { BufferCursor } from "@lntools/buffer-cursor";
import { ITlvSerializable } from "./tlv-serializable";

export class TlvRecordSerializer {
  public serialize(tlv: ITlvSerializable): Buffer {
    const type = tlv.type;
    const value = tlv.serializeValue();
    const buf = Buffer.alloc(
      BufferCursor.bigSizeBytes(type) +
      BufferCursor.bigSizeBytes(BigInt(value.length)) +
      value.length,
    ); // prettier-ignore
    const writer = new BufferCursor(buf);
    writer.writeBigSize(type);
    writer.writeBigSize(BigInt(value.length));
    writer.writeBytes(value);
    return buf;
  }
}
