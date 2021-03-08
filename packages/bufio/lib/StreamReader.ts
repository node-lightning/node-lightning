import { Readable } from "stream";
import { bufToStream } from "./bufToStream";

/**
 * Wraps a readable stream and provides utilities to assist with reading values
 * off the stream. If there is an attempt to read past the stream, an exception
 * will thrown.
 */
export class StreamReader {
    /**
     * Constructs a new StreamReader from the provided hex string.
     * @param hex
     */
    public static fromHex(hex: string): StreamReader {
        return StreamReader.fromBuffer(Buffer.from(hex, "hex"));
    }

    /**
     * Constructs a new StreamReader from the provided Buffer
     * @param buf
     */
    public static fromBuffer(buf: Buffer): StreamReader {
        return new StreamReader(bufToStream(buf));
    }

    constructor(readonly stream: Readable) {}

    /**
     * Reads a VarInt from Bitcoin which is an unsigned integer from
     * 0 to 2^64-1 occupying 1 to 9 bytes. The first byte indicates the variable
     * length and numbers read in little-endian.
     *  < 0xfd   8-bit number
     *    0xfd:  16-bit LE number (3 bytes consumed)
     *    0xfe:  32-bit LE number (5 bytes consumed)
     *    0xff:  64-bit LE number (9 bytes consumed)
     */
    public readVarInt(): bigint {
        const byte = this.readUInt8();
        if (byte < 0xfd) return BigInt(byte);
        if (byte === 0xfd) return BigInt(this.readUInt16LE());
        if (byte === 0xfe) return BigInt(this.readUInt32LE());
        if (byte === 0xff) return this.readBigUInt64LE();
    }

    /**
     * Reads a BigSize from BOLT specs which is an unsigned integer from
     * 0 to 2^64-1 occupying 1 to 9 bytes. The first byte indicates the variable
     * length and numbers read in big-endian.
     *  < 0xfd   8-bit number
     *    0xfd:  16-bit BE number (3 bytes consumed)
     *    0xfe:  32-bit BE number (5 bytes consumed)
     *    0xff:  64-bit BE number (9 bytes consumed)
     */
    public readBigSize(): bigint {
        const byte = this.readUInt8();
        if (byte < 0xfd) return BigInt(byte);
        if (byte === 0xfd) return BigInt(this.readUInt16BE());
        if (byte === 0xfe) return BigInt(this.readUInt32BE());
        if (byte === 0xff) return BigInt(this.readBigUInt64BE());
    }

    /**
     * Reads `n` bytes from the stream and returns a Buffer. This function
     * operates in two modes:
     *   1. length is provided
     *   2. length is not provided
     *
     * If the length is provided and the requested bytes are not available
     * on the stream an exception will be thrown.
     *
     * If no length is provided it will return the remaining bytes in the Stream
     * or it will return an empty buffer if all bytes have been read from the
     * stream.
     *
     * @remarks
     * This functionality differs from the standard stream interface. In the
     * event a length is provided, the stream will return the any remaining
     * bytes. This method performs a length check to ensure the full data read
     * occurred to prevent downstream length checks from being required. The
     * stream functionality also returns a null if there is no additional data
     * to be read from the stream.
     * @param n
     */
    public readBytes(n?: number): Buffer {
        const bytes = this.stream.read(n) as Buffer;
        if (n === 0) return Buffer.alloc(0);
        if (n !== undefined) this._assertLen(bytes, n);
        if (n === undefined && bytes === null) return Buffer.alloc(0);
        return bytes;
    }

    /**
     * Reads the supplied number of bytes and converts the bytes into a
     * little-endian unsigned integer.
     * @param n
     */
    public readUIntLE(n: number): number {
        const byte = this.readBytes(n);
        return byte.readUIntLE(0, n);
    }

    /**
     * Reads the supplied number of bytes and converts the bytes into a
     * little-endian unsigned integer.
     * @param n
     */
    public readUIntBE(n: number): number {
        const byte = this.readBytes(n);
        return byte.readUIntBE(0, n);
    }

    /**
     * Reads a UInt8 from the stream
     */
    public readUInt8(): number {
        const byte = this.readBytes(1);
        return byte[0];
    }

    /**
     * Reads a UInt16 in little-endian from the stream
     */
    public readUInt16LE(): number {
        const bytes = this.readBytes(2);
        return bytes.readUInt16LE(0);
    }

    /**
     * Reads a UInt16 in big-endian from the stream
     */
    public readUInt16BE(): number {
        const bytes = this.readBytes(2);
        return bytes.readUInt16BE(0);
    }

    /**
     * Reads a UInt32 in little-endian from the stream
     */
    public readUInt32LE(): number {
        const bytes = this.readBytes(4);
        return bytes.readUInt32LE(0);
    }

    /**
     * Reads a UInt32 in big-endian from the stream
     */
    public readUInt32BE(): number {
        const bytes = this.readBytes(4);
        return bytes.readUInt32BE(0);
    }

    /**
     * Reads a UInt64 in little-endian from the stream
     */
    public readBigUInt64LE(): bigint {
        const bytes = this.readBytes(8);
        return bytes.readBigUInt64LE(0);
    }

    /**
     * Reads a UInt64 in big-endian from the stream
     */
    public readBigUInt64BE(): bigint {
        const bytes = this.readBytes(8);
        return bytes.readBigUInt64BE(0);
    }

    /**
     * Pushes bytes back on to the stream
     * @param chunk
     */
    public unshift(chunk: Buffer): void {
        this.stream.unshift(chunk);
    }

    private _assertLen(val: Buffer, n: number) {
        if (val === null || val.length !== n) throw new RangeError("Out of range");
    }
}
