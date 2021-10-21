import assert from "assert";

/**
 * BufferReader class is used to simplify reading information from a Buffer
 */
export class BufferReader {
    /**
     * Returns the number of bytes that will be used to encode
     * a BigSize number. BigSize is defined in Lightning Network BOLT 07
     */
    public static bigSizeBytes(num: bigint): number {
        if (num < BigInt(0xfd)) return 1;
        if (num < BigInt(0x10000)) return 3;
        if (num < BigInt(0x100000000)) return 5;
        else return 9;
    }

    private _buffer: Buffer;
    private _position: number;
    private _lastReadBytes: number;

    /**
     * Constructs a reader from the supplied Buffer
     */
    constructor(buffer: Buffer) {
        assert(Buffer.isBuffer(buffer), "Requires a buffer");
        this._buffer = buffer;
        this._position = 0;
        this._lastReadBytes = 0;
    }

    /**
     * Gets or sets the current position of the cursor in the buffer
     */
    public get position(): number {
        return this._position;
    }

    public set position(val: number) {
        this._position = val;
    }

    /**
     * Gets if the cursor is at the end of file.
     */
    public get eof(): boolean {
        return this._position === this._buffer.length;
    }

    /**
     * Gets the underlying buffer that the cursor
     * is reading from.
     */
    public get buffer(): Buffer {
        return this._buffer;
    }

    /**
     * Number of bytes read in last operation executed on the cursor.
     * Especially useful for operations that return variable length of
     * results such as readBytes or readVarUint.
     */
    public get lastReadBytes(): number {
        return this._lastReadBytes;
    }

    /**
     * Read a UInt8 number
     */
    public readUInt8(): number {
        return this._readStandard(this.readUInt8.name, 1);
    }

    /**
     * Read a UInt16 number as little-endian
     */
    public readUInt16LE(): number {
        return this._readStandard(this.readUInt16LE.name, 2);
    }

    /**
     * Read a UInt16 number as big-endian
     */
    public readUInt16BE(): number {
        return this._readStandard(this.readUInt16BE.name, 2);
    }

    /**
     * Read a UInt32 number as little-endian
     */
    public readUInt32LE(): number {
        return this._readStandard(this.readUInt32LE.name, 4);
    }

    /**
     * Read a UInt32 number as big-endian
     */
    public readUInt32BE(): number {
        return this._readStandard(this.readUInt32BE.name, 4);
    }

    /**
     * Read a UInt64 number as big-endian
     */
    public readUInt64BE(): bigint {
        return BigInt("0x" + this.readBytes(8).toString("hex"));
    }

    /**
     * Read a UInt64 number as little-endian
     */
    public readUInt64LE(): bigint {
        return BigInt(
            "0x" +
                this.readBytes(8)
                    .reverse()
                    .toString("hex"),
        );
    }

    /**
     * Reads a variable length unsigned integer as specified in the protocol
     * documentation and aways returns a BN to maintain a consistant call
     * signature.
     *
     * @remarks
     * Specified in:
     * https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer
     *
     * Reads the first byte and determines the length of the remaining integer.
     * < 0xfd = 1 byte number
     *   0xfd = 2 byte number (3 bytes total)
     *   0xfe = 4 byte number (5 bytes total)
     *   0xff = 8 byte number (9 bytes total)
     */
    public readVarUint(): bigint {
        const size = this.readUInt8();
        if (size < 0xfd) {
            this._lastReadBytes = 1;
            return BigInt(size);
        }
        switch (size) {
            case 0xfd:
                this._lastReadBytes = 3;
                return BigInt(this.readUInt16LE());
            case 0xfe:
                this._lastReadBytes = 5;
                return BigInt(this.readUInt32LE());
            case 0xff:
                this._lastReadBytes = 9;
                return this.readUInt64LE();
        }
    }

    /**
     * Reads a variable length unsigned integer as specified in the Lightning Network
     * protocol documentation and always returns a BigInt to maintain a consistent
     * call signature.
     *
     * @remarks
     * Specified in:
     * https://github.com/lightningnetwork/lightning-rfc/blob/master/01-messaging.md#appendix-a-bigsize-test-vectors
     *
     * < 0xfd = 1 byte number
     *   0xfd = 2 byte number (3 bytes total)
     *   0xfe = 4 byte number (5 bytes total)
     *   0xff = 8 byte number (9 bytes total)
     */
    public readBigSize(): bigint {
        const size = this.readUInt8();
        if (size < 0xfd) {
            this._lastReadBytes = 1;
            return BigInt(size);
        }
        switch (size) {
            case 0xfd: {
                this._lastReadBytes = 3;
                const val = this.readUInt16BE();
                if (val < 0xfd) throw new Error("decoded varint is not canonical");
                return BigInt(val);
            }
            case 0xfe: {
                this._lastReadBytes = 5;
                const val = this.readUInt32BE();
                if (val < 0x10000) throw new Error("decoded varint is not canonical");
                return BigInt(val);
            }
            case 0xff: {
                this._lastReadBytes = 9;
                const val = this.readUInt64BE();
                if (val < BigInt(0x100000000)) throw new Error("decoded varint is not canonical");
                return val;
            }
        }
    }

    /**
     * Read bytes from the buffer into a new Buffer. Unlike the default
     * slice method, the values do not point to the same memory location
     * as the source buffer. The values are copied to a new buffer.
     *
     * @param len optional number of bytes to read, returns
     * all remaining bytes when omitted
     */
    public readBytes(len?: number): Buffer {
        if (len === 0) {
            this._lastReadBytes = 0;
            return Buffer.alloc(0);
        } else if (len > 0) {
            if (this._position + len > this._buffer.length) {
                throw new RangeError("Index out of range");
            }
            const slice = this._buffer.slice(this._position, this._position + len);
            const result = Buffer.alloc(slice.length, slice);
            this._position += len;
            this._lastReadBytes = len;
            return result;
        } else {
            if (this._position === this._buffer.length) {
                this._lastReadBytes = 0;
                return Buffer.alloc(0);
            }
            const slice = this._buffer.slice(this._position);
            const result = Buffer.alloc(slice.length, slice);
            this._position = this._buffer.length;
            this._lastReadBytes = result.length;
            return result;
        }
    }

    /**
     * Reads bytes from the buffer at the current position without
     * moving the cursor.
     * @param len optional number of bytes to read
     */
    public peakBytes(len?: number): Buffer {
        if (len === 0) {
            return Buffer.alloc(0);
        } else if (len > 0) {
            if (this._position + len > this._buffer.length) {
                throw new RangeError("Index out of range");
            }
            const slice = this._buffer.slice(this._position, this._position + len);
            const result = Buffer.alloc(slice.length, slice);
            return result;
        } else {
            if (this._position === this._buffer.length) throw new RangeError("Index out of range");
            const slice = this._buffer.slice(this._position);
            const result = Buffer.alloc(slice.length, slice);
            return result;
        }
    }

    /**
     * TLV 0 to 2 byte unsigned integer encoded in big-endian.
     */
    public readTUInt16(): number {
        const size = Math.min(2, this._buffer.length - this._position);
        if (size === 0) return 0;
        const val = this._buffer.readUIntBE(this._position, size);
        this._assertMinimalTUInt(BigInt(val), size);
        this._position += size;
        return val;
    }

    /**
     * TLV 0 to 4 byte unsigned integer encoded in big-endian.
     */
    public readTUInt32(): number {
        const size = Math.min(4, this._buffer.length - this._position);
        if (size === 0) return 0;
        const val = this._buffer.readUIntBE(this._position, size);
        this._assertMinimalTUInt(BigInt(val), size);
        this._position += size;
        return val;
    }

    /**
     * TLV 0 to 8 byte unsigned integer encoded in big-endian.
     */
    public readTUInt64(): bigint {
        const size = Math.min(8, this._buffer.length - this._position);
        if (size === 0) return BigInt(0);
        const hex =
            this._buffer.slice(this._position, this._position + size).toString("hex") || "0";
        const val = BigInt("0x" + hex);
        this._assertMinimalTUInt(val, size);
        this._position += size;
        return val;
    }

    /**
     * Helper for reading off buffer using built-in read functions
     * @param fn name of function
     * @param len length to read
     */
    private _readStandard(fn: string, len: number): number {
        if (this._position + len > this._buffer.length) {
            throw new RangeError("Index out of range");
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const result: number = this._buffer[fn](this._position);
        this._position += len;
        this._lastReadBytes = len;
        return result;
    }

    /**
     * Ensures the TUInt value is minimally encoded
     * @param num
     * @param bytes
     */
    private _assertMinimalTUInt(num: bigint, bytes: number) {
        const msg = "TUInt not minimal";
        for (let i = 0; i < 9; i++) {
            if (num < BigInt("0x1" + "".padStart(i * 2, "0"))) {
                return assert.equal(bytes, i, msg);
            }
        }
    }
}
