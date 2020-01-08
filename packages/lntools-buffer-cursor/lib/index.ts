import assert from "assert";
import BN from "bn.js";

export class BufferCursor {
  private _buffer: Buffer;
  private _position: number;
  private _lastReadBytes: number;

  /**
   * Constructs a read and write cursor for a buffer.
   */
  constructor(buffer: Buffer) {
    assert(Buffer.isBuffer(buffer), "Requires a buffer");

    /** @type {Buffer} */
    this._buffer = buffer;

    /** @type {number} */
    this._position = 0;

    /** @type {number} */
    this._lastReadBytes = 0;
  }

  /**
   * Gets or sets the current position of the cursor in the buffer
   */
  get position() {
    return this._position;
  }

  set position(val) {
    this._position = val;
  }

  /**
   * Gets if the cursor is at the end of file.
   */
  get eof() {
    return this._position === this._buffer.length;
  }

  /**
   * Gets the underlying buffer that the cursor
   * is reading from.
   */
  get buffer() {
    return this._buffer;
  }

  /**
   * Number of bytes read in last operation executed on the cursor.
   * Especially useful for operations that return variable length of
   * results such as readBytes or readVarUint.
   */
  get lastReadBytes() {
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
  public readUInt64BE(): BN {
    return new BN(this.readBytes(8), null, "be");
  }

  /**
   * Read a UInt64 number as little-endian
   */
  public readUInt64LE(): BN {
    return new BN(this.readBytes(8), null, "le");
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
  public readVarUint(): BN {
    const size = this.readUInt8();
    if (size < 0xfd) {
      this._lastReadBytes = 1;
      return new BN(size);
    }
    switch (size) {
      case 0xfd:
        this._lastReadBytes = 3;
        return new BN(this.readUInt16LE());
      case 0xfe:
        this._lastReadBytes = 5;
        return new BN(this.readUInt32LE());
      case 0xff:
        this._lastReadBytes = 9;
        return this.readUInt64LE();
    }
  }

  /**
   * Reads a variable length unsigned integer as specified in the Lightning Network
   * protocol documentation and always returns a BN to maintain a consistent
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
  public readBigSize(): BN {
    const size = this.readUInt8();
    if (size < 0xfd) {
      this._lastReadBytes = 1;
      return new BN(size);
    }
    switch (size) {
      case 0xfd: {
        this._lastReadBytes = 3;
        const val = this.readUInt16BE();
        if (val < 0xfd) throw new Error("decoded varint is not canonical");
        return new BN(val);
      }
      case 0xfe: {
        this._lastReadBytes = 5;
        const val = this.readUInt32BE();
        if (val < 0x10000) throw new Error("decoded varint is not canonical");
        return new BN(val);
      }
      case 0xff: {
        this._lastReadBytes = 9;
        const val = this.readUInt64BE();
        if (val.lt(new BN(0x100000000))) throw new Error("decoded varint is not canonical");
        return val;
      }
    }
  }

  /**
   * Read bytes from the buffer into a new Buffer. Unlike the default
   * slice method, the values do not point to the same memory location
   * as the source buffer. The values are copied to a new buffer.
   *
   * @param [len] optional number of bytes to read, returns
   * all remaining bytes when omitted
   */
  public readBytes(len: number): Buffer {
    if (len === 0) {
      this._lastReadBytes = 0;
      return Buffer.alloc(0);
    } else if (len > 0) {
      if (this._position + len > this._buffer.length) throw new RangeError("Index out of range");
      const slice = this._buffer.slice(this._position, this._position + len);
      const result = Buffer.alloc(slice.length, slice);
      this._position += len;
      this._lastReadBytes = len;
      return result;
    } else {
      if (this._position === this._buffer.length) throw new RangeError("Index out of range");
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
   * @param len number of bytes to read
   */
  public peakBytes(len: number): Buffer {
    if (len === 0) {
      return Buffer.alloc(0);
    } else if (len > 0) {
      if (this._position + len > this._buffer.length) throw new RangeError("Index out of range");
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
   * Write at the current positiion
   * @param val
   */
  public writeUInt8(val: number) {
    this._writeStandard(this.writeUInt8.name, val, 1);
  }

  /**
   * Write at the current positiion
   * @param val
   */
  public writeUInt16LE(val: number) {
    this._writeStandard(this.writeUInt16LE.name, val, 2);
  }

  /**
   * Write at the current positiion
   * @param val
   */
  public writeUInt16BE(val: number) {
    this._writeStandard(this.writeUInt16BE.name, val, 2);
  }

  /**
   * Write at the current positiion
   * @param val
   */
  public writeUInt32LE(val: number) {
    this._writeStandard(this.writeUInt32LE.name, val, 4);
  }

  /**
   * Write at the current positiion
   * @param val
   */
  public writeUInt32BE(val: number) {
    this._writeStandard(this.writeUInt32BE.name, val, 4);
  }

  /**
   * Write at the current positiion
   * @param value
   */
  public writeUInt64LE(value: number | BN) {
    if (!(value instanceof BN)) value = new BN(value);
    this.writeBytes(value.toBuffer("le", 8));
  }

  /**
   * Write at the current positiion
   * @param value
   */
  public writeUInt64BE(value: number | BN) {
    if (!(value instanceof BN)) value = new BN(value);
    this.writeBytes(value.toBuffer("be", 8));
  }

  /**
   * Write bytes at the current positiion
   * @param buffer
   */
  public writeBytes(buffer: Buffer) {
    if (!buffer || !buffer.length) return;
    if (this._position + buffer.length > this._buffer.length) {
      throw new RangeError("Index out of range");
    }
    buffer.copy(this._buffer, this._position);
    this._position += buffer.length;
  }

  /**
   * Reads a variable length unsigned integer as specified in the Lightning Network
   * protocol documentation and always returns a BN to maintain a consistent
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
  public writeBigSize(num: BN) {
    if (num.lt(new BN("fd", "hex"))) {
      this.writeUInt8(num.toNumber());
    } else if (num.lt(new BN("10000", "hex"))) {
      this.writeUInt8(0xfd);
      this.writeUInt16BE(num.toNumber());
    } else if (num.lt(new BN("100000000", "hex"))) {
      this.writeUInt8(0xfe);
      this.writeUInt32BE(num.toNumber());
    } else {
      this.writeUInt8(0xff);
      this.writeBytes(num.toBuffer("be", 8));
    }
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
    const result = this._buffer[fn](this._position);
    this._position += len;
    this._lastReadBytes = len;
    return result;
  }

  /**
   * Helper for writing to the buffer using built-in write
   * functions
   * @param fn name of function
   * @param val number to write
   * @param len length of number in bytes
   */
  private _writeStandard(fn: string, val: number, len: number) {
    if (this._position + len > this._buffer.length) {
      throw new RangeError("Index out of range");
    }
    this._buffer[fn](val, this._position);
    this._position += len;
  }
}
