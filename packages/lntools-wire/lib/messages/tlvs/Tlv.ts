import { BufferCursor } from "@lntools/buffer-cursor";

export abstract class Tlv {
    public type: bigint;

    public serialize(encoding?: number): Buffer {
        const tlv = this;
        const type = tlv.type;
        const value = tlv.serializeValue(encoding);
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

    public abstract serializeValue(encoding?: number);
}
