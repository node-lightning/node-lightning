let assert = require('assert');

class BufferReader {
  static from(buffer) {
    return new BufferReader(buffer);
  }

  constructor(buffer) {
    assert(Buffer.isBuffer(buffer), 'Requires a buffer');
    this.buffer = buffer;
    this.position = 0;
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

  readBytes(len) {
    assert(this.position + len <= this.buffer.length, 'out of bounds');
    let result = this.buffer.slice(this.position, len);
    this.position += len;
    return result;
  }

  _readStandard(fn, len) {
    let result = this.buffer[fn](this.position);
    this.position += len;
    return result;
  }
}

module.exports = BufferReader;
