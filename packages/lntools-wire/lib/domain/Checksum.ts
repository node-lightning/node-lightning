import crc32c from "sse4_crc32";

/**
 * CRC32C checksum for the provided value
 */
export class Checksum {
    public static fromBuffer(buf: Buffer): Checksum {
        return new Checksum(crc32c.calculate(buf));
    }

    public static empty(): Checksum {
        return new Checksum(0);
    }

    private _checksum: number;

    private constructor(checksum: number) {
        this._checksum = checksum;
    }

    public equals(other: Checksum): boolean {
        return this._checksum === other._checksum;
    }

    public toNumber(): number {
        return this._checksum;
    }

    public toBuffer(): Buffer {
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(this._checksum, 0);
        return buf;
    }

    public toString(): string {
        return this._checksum.toString(16);
    }
}
