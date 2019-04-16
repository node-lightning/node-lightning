import assert = require('assert');
import BN = require('bn.js');

export class BufferCursor {
  _buffer: Buffer;
  _position: number;
  _lastReadBytes: number;

  constructor(buffer: Buffer) {
    assert(Buffer.isBuffer(buffer), 'Requires a buffer');
    this._buffer = buffer;
    this._position = 0;
    this._lastReadBytes = 0;
  }

  get position() {
    return this._position;
  }

  get eof() {
    return this._position === this._buffer.length;
  }

  get buffer() {
    return this._buffer;
  }

  /**
    Number of bytes read in last operation executed on the cursor.
    Especially useful for operations that return variable length of
    results such as readBytes or readVarUint.
   */
  get lastReadBytes() {
    return this._lastReadBytes;
  }

  readUInt8() {
    return this._readStandard(this.readUInt8.name, 1);
  }

  readUInt16LE() {
    return this._readStandard(this.readUInt16LE.name, 2);
  }

  readUInt16BE() {
    return this._readStandard(this.readUInt16BE.name, 2);
  }

  readUInt32LE() {
    return this._readStandard(this.readUInt32LE.name, 4);
  }

  readUInt32BE() {
    return this._readStandard(this.readUInt32BE.name, 4);
  }

  readUInt64BE() {
    return new BN(this.readBytes(8), null, 'be');
  }

  readUInt64LE() {
    return new BN(this.readBytes(8), null, 'le');
  }

  /**
    Reads a variable length unsigned integer as specified in the protocol
    documentation and aways returns a BN to maintain a consistant call
    signature.

    @remarks
    Specified in:
    https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer

    Reads the first byte and determines the length of the remaining integer.
    < 0xfd = 1 byte number
      0xfd = 2 byte number (3 bytes total)
      0xfe = 4 byte number (5 bytes total)
      0xff = 8 byte number (9 bytes total)
   */
  readVarUint(): BN {
    let size = this.readUInt8();
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

  readBytes(len: number) {
    if (len === 0) {
      this._lastReadBytes = 0;
      return Buffer.alloc(0);
    } else if (len > 0) {
      if (this._position + len > this._buffer.length) throw new RangeError('Index out of range');
      let result = this._buffer.slice(this._position, this._position + len);
      this._position += len;
      this._lastReadBytes = len;
      return result;
    } else {
      if (this._position === this._buffer.length) throw new RangeError('Index out of range');
      let result = this._buffer.slice(this._position);
      this._position = this._buffer.length;
      this._lastReadBytes = result.length;
      return result;
    }
  }

  peakBytes(len: number) {
    if (len === 0) {
      return Buffer.alloc(0);
    } else if (len > 0) {
      if (this._position + len > this._buffer.length) throw new RangeError('Index out of range');
      let result = this._buffer.slice(this._position, this._position + len);
      return result;
    } else {
      if (this._position === this._buffer.length) throw new RangeError('Index out of range');
      let result = this._buffer.slice(this._position);
      return result;
    }
  }

  writeUInt8(val: number) {
    this._writeStandard(this.writeUInt8.name, val, 1);
  }

  writeUInt16LE(val: number) {
    this._writeStandard(this.writeUInt16LE.name, val, 2);
  }

  writeUInt16BE(val: number) {
    this._writeStandard(this.writeUInt16BE.name, val, 2);
  }

  writeUInt32LE(val: number) {
    this._writeStandard(this.writeUInt32LE.name, val, 4);
  }

  writeInt32LE(val: number) {
    this._writeStandard(this.writeInt32LE.name, val, 4);
  }

  writeUInt32BE(val: number) {
    this._writeStandard(this.writeUInt32BE.name, val, 4);
  }

  writeUInt64LE(value: number | BN) {
    if (!(value instanceof BN)) value = new BN(value);
    this.writeBytes(value.toBuffer('le', 8));
  }

  writeBytes(buffer: Buffer) {
    if (!buffer || !buffer.length) return;
    if (this._position + buffer.length > this._buffer.length)
      throw new RangeError('Index out of range');
    buffer.copy(this._buffer, this._position);
    this._position += buffer.length;
  }

  _readStandard(fn: string, len: number): number {
    let result = this._buffer[fn](this._position);
    this._position += len;
    this._lastReadBytes = len;
    return result;
  }

  _writeStandard(fn: string, val: number, len: number) {
    this._buffer[fn](val, this._position);
    this._position += len;
  }
}
