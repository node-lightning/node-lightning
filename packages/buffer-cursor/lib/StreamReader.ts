import { Readable } from "stream";

export class StreamReader {
    constructor(readonly stream: Readable) {}

    public readVarInt(): bigint {
        const byte = this.readUInt8();
        if (byte < 0xfd) return BigInt(byte);
        if (byte === 0xfd) return BigInt(this.readUInt16LE());
        if (byte === 0xfe) return BigInt(this.readUInt32LE());
        if (byte === 0xff) return this.readBigUInt64LE();
    }

    public readBigSize(): bigint {
        const byte = this.readUInt8();
        if (byte < 0xfd) return BigInt(byte);
        if (byte === 0xfd) return BigInt(this.readUInt16BE());
        if (byte === 0xfe) return BigInt(this.readUInt32BE());
        if (byte === 0xff) return BigInt(this.readBigUInt64BE());
    }

    public readBytes(n: number): Buffer {
        const bytes = this.stream.read(n);
        this._assertLen(bytes, n);
        return bytes;
    }

    public readUInt8(): number {
        const byte = this.readBytes(1);
        return byte[0];
    }

    public readUInt16LE(): number {
        const bytes = this.readBytes(2);
        return bytes.readUInt16LE(0);
    }

    public readUInt16BE(): number {
        const bytes = this.readBytes(2);
        return bytes.readUInt16BE(0);
    }

    public readUInt32LE(): number {
        const bytes = this.readBytes(4);
        return bytes.readUInt32LE(0);
    }

    public readUInt32BE(): number {
        const bytes = this.readBytes(4);
        return bytes.readUInt32BE(0);
    }

    public readBigUInt64LE(): bigint {
        const bytes = this.readBytes(8);
        return bytes.readBigUInt64LE(0);
    }

    public readBigUInt64BE(): bigint {
        const bytes = this.readBytes(8);
        return bytes.readBigUInt64BE(0);
    }

    private _assertLen(val: Buffer, n: number) {
        if (val === null || val.length !== n) throw new RangeError("Out of range");
    }
}
