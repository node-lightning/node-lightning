// @ts-check

const assert = require('assert');
const BN = require('bn.js');

class BufferCursor {
  /**
    Constructs a read and write cursor for a buffer.
    @param {Buffer} buffer
   */
  constructor(buffer) {
    assert(Buffer.isBuffer(buffer), 'Requires a buffer');

    /** @type {Buffer} */
    this._buffer = buffer;

    /** @type {number} */
    this._position = 0;

    /** @type {number} */
    this._lastReadBytes = 0;
  }

  /**
    Gets the current position of the cursor in the buffer
    @type {number}
   */
  get position() {
    return this._position;
  }

  /**
    Gets if the cursor is at the end of file.
    @type {boolean}
   */

  get eof() {
    return this._position === this._buffer.length;
  }

  /**
    Gets the underlying buffer that the cursor
    is reading from.
    @type {Buffer}
   */
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

  /**
    Read a number
    @returns {number}
   */
  readUInt8() {
    return this._readStandard(this.readUInt8.name, 1);
  }

  /**
    Read a number
    @returns {number}
   */
  readUInt16LE() {
    return this._readStandard(this.readUInt16LE.name, 2);
  }

  /**
    Read a number
    @returns {number}
   */
  readUInt16BE() {
    return this._readStandard(this.readUInt16BE.name, 2);
  }

  /**
    Read a number
    @returns {number}
   */
  readUInt32LE() {
    return this._readStandard(this.readUInt32LE.name, 4);
  }

  /**
    Read a number
    @returns {number}
   */
  readUInt32BE() {
    return this._readStandard(this.readUInt32BE.name, 4);
  }

  /**
    Read a number
    @returns {BN}
   */
  readUInt64BE() {
    return new BN(this.readBytes(8), null, 'be');
  }

  /**
    Read a number
    @returns {BN}
   */
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

    @returns {BN}
   */
  readVarUint() {
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

  /**
    Read bytes from the buffer into a new Buffer. Unlike the default
    slice method, the values do not point to the same memory location
    as the source buffer. The values are copied to a new buffer.

    @param {number} [len] optional number of bytes to read, returns
    all remaining bytes when omitted
    @returns {Buffer}
   */
  readBytes(len) {
    if (len === 0) {
      this._lastReadBytes = 0;
      return Buffer.alloc(0);
    } else if (len > 0) {
      if (this._position + len > this._buffer.length) throw new RangeError('Index out of range');
      let slice = this._buffer.slice(this._position, this._position + len);
      let result = Buffer.alloc(slice.length, slice);
      this._position += len;
      this._lastReadBytes = len;
      return result;
    } else {
      if (this._position === this._buffer.length) throw new RangeError('Index out of range');
      let slice = this._buffer.slice(this._position);
      let result = Buffer.alloc(slice.length, slice);
      this._position = this._buffer.length;
      this._lastReadBytes = result.length;
      return result;
    }
  }

  /**
    Reads bytes from the buffer at the current position without
    moving the cursor.

    @param {number} len
    @returns {Buffer}
   */
  peakBytes(len) {
    if (len === 0) {
      return Buffer.alloc(0);
    } else if (len > 0) {
      if (this._position + len > this._buffer.length) throw new RangeError('Index out of range');
      let slice = this._buffer.slice(this._position, this._position + len);
      let result = Buffer.alloc(slice.length, slice);
      return result;
    } else {
      if (this._position === this._buffer.length) throw new RangeError('Index out of range');
      let slice = this._buffer.slice(this._position);
      let result = Buffer.alloc(slice.length, slice);
      return result;
    }
  }

  /**
    Write at the current positiion
    @param {number} val
   */
  writeUInt8(val) {
    this._writeStandard(this.writeUInt8.name, val, 1);
  }

  /**
    Write at the current positiion
    @param {number} val
   */
  writeUInt16LE(val) {
    this._writeStandard(this.writeUInt16LE.name, val, 2);
  }

  /**
    Write at the current positiion
    @param {number} val
   */
  writeUInt16BE(val) {
    this._writeStandard(this.writeUInt16BE.name, val, 2);
  }

  /**
    Write at the current positiion
    @param {number} val
   */
  writeUInt32LE(val) {
    this._writeStandard(this.writeUInt32LE.name, val, 4);
  }

  /**
    Write at the current positiion
    @param {number} val
   */
  writeUInt32BE(val) {
    this._writeStandard(this.writeUInt32BE.name, val, 4);
  }

  /**
    Write at the current positiion
    @param {number|BN} value
   */
  writeUInt64LE(value) {
    if (!(value instanceof BN)) value = new BN(value);
    this.writeBytes(value.toBuffer('le', 8));
  }

  /**
    Write at the current positiion
    @param {number|BN} value
   */
  writeUInt64BE(value) {
    if (!(value instanceof BN)) value = new BN(value);
    this.writeBytes(value.toBuffer('be', 8));
  }

  /**
    Write bytes at the current positiion
    @param {Buffer} buffer
   */
  writeBytes(buffer) {
    if (!buffer || !buffer.length) return;
    if (this._position + buffer.length > this._buffer.length)
      throw new RangeError('Index out of range');
    buffer.copy(this._buffer, this._position);
    this._position += buffer.length;
  }

  /**
    Helper for reading off buffer using built-in read functions
    @private
    @param {string} fn name of function
    @param {number} len length to read
    @returns {number}
   */
  _readStandard(fn, len) {
    if (this._position + len > this._buffer.length) {
      throw new RangeError('Index out of range');
    }
    let result = this._buffer[fn](this._position);
    this._position += len;
    this._lastReadBytes = len;
    return result;
  }

  /**
    Helper for writing to the buffer using built-in write
    functions
    @private
    @param {string} fn name of function
    @param {number} val number to write
    @param {number} len length of number in bytes
   */
  _writeStandard(fn, val, len) {
    if (this._position + len > this._buffer.length) {
      throw new RangeError('Index out of range');
    }
    this._buffer[fn](val, this._position);
    this._position += len;
  }
}

module.exports = BufferCursor;
