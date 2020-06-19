import { BufferWriter } from "@lntools/buffer-cursor";

export abstract class Tlv {
    public type: bigint;

    public serialize(encoding?: number): Buffer {
        const tlv = this;
        const type = tlv.type;
        const value = tlv.serializeValue(encoding);

        const writer = new BufferWriter();
        writer.writeBigSize(type);
        writer.writeBigSize(BigInt(value.length));
        writer.writeBytes(value);
        return writer.toBuffer();
    }

    public abstract serializeValue(encoding?: number);
}
