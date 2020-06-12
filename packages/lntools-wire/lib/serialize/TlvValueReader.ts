import assert from "assert";
import { ShortChannelId } from "../ShortChannelId";
import { shortChannelIdFromBuffer } from "../ShortChannelIdUtils";

export class TlvValueReader {
    private _buffer: Buffer;
    private _position: number = 0;

    constructor(buf: Buffer) {
        this._buffer = buf;
    }

    get eof(): boolean {
        return this._position === this._buffer.length;
    }

    get position(): number {
        return this._position;
    }

    get size(): number {
        return this._buffer.length;
    }

    /**
     * Done should be called after reading all value records. This
     * method will assert that all data from the buffer has been
     * read and will throw an exception if it has not.
     */
    public done() {
        if (!this.eof) throw new Error("Extraneous TLV data");
    }

    public readUInt8(): number {
        const val = this._buffer.readUInt8(this._position);
        this._position += 1;
        return val;
    }

    public readUInt16(): number {
        const val = this._buffer.readUInt16BE(this._position);
        this._position += 2;
        return val;
    }

    public readUInt32(): number {
        const val = this._buffer.readUInt32BE(this._position);
        this._position += 4;
        return val;
    }

    public readUInt64(): bigint {
        const val = BigInt("0x" + this._buffer.slice(this._position, this._position + 8).toString("hex")); // prettier-ignore
        this._position += 8;
        return val;
    }

    public readTUInt16(): number {
        const size = Math.min(2, this._buffer.length - this._position);
        if (size === 0) return 0;
        const val = this._buffer.readUIntBE(this._position, size);
        assertMinimalTUInt(BigInt(val), size);
        this._position += size;
        return val;
    }

    public readTUInt32(): number {
        const size = Math.min(4, this._buffer.length - this._position);
        if (size === 0) return 0;
        const val = this._buffer.readUIntBE(this._position, size);
        assertMinimalTUInt(BigInt(val), size);
        this._position += size;
        return val;
    }

    public readTUInt64(): bigint {
        const size = Math.min(8, this._buffer.length - this._position);
        if (size === 0) return BigInt(0);
        const hex =
            this._buffer.slice(this._position, this._position + size).toString("hex") || "0";
        const val = BigInt("0x" + hex);
        assertMinimalTUInt(val, size);
        this._position += size;
        return val;
    }

    public readBigSize(): bigint {
        const first = this.readUInt8();
        if (first < 0xfd) return BigInt(first);
        if (first === 0xfd) return BigInt(this.readUInt16());
        if (first === 0xfe) return BigInt(this.readUInt32());
        else return BigInt("0x" + this.readBytes(8).toString("hex"));
    }

    public readChainHash(): Buffer {
        return this.readBytes(32);
    }

    public readChannelId(): Buffer {
        return this.readBytes(32);
    }

    public readSha256(): Buffer {
        return this.readBytes(32);
    }

    public readSignature(): Buffer {
        return this.readBytes(64);
    }

    public readPoint(): Buffer {
        return this.readBytes(33);
    }

    public readShortChannelId(): ShortChannelId {
        return shortChannelIdFromBuffer(this.readBytes(8));
    }

    public readBytes(size?: number) {
        if (size === undefined) size = this._buffer.length - this._position;
        if (this._position + size > this._buffer.length) throw new RangeError("Index out of range");
        const val = Buffer.from(this._buffer.slice(this._position, this._position + size));
        this._position += size;
        return val;
    }
}

function assertMinimalTUInt(num: bigint, bytes: number) {
    const msg = "TUInt not minimal";
    for (let i = 0; i < 9; i++) {
        if (num < BigInt("0x1" + "".padStart(i * 2, "0"))) {
            return assert.equal(bytes, i, msg);
        }
    }
}
