class BufferWriter {
  static from(buffer) {
    return new BufferWriter(buffer);
  }

  constructor(buffer) {
    this.buffer = buffer;
    this.position = 0;
  }

  writeUInt8(val) {
    this._writeStandard(this.writeUInt8.name, val, 1);
  }

  writeUInt16LE(val) {
    this._writeStandard(this.writeUInt16LE.name, val, 2);
  }

  writeUInt16BE(val) {
    this._writeStandard(this.writeUInt16BE.name, val, 2);
  }

  writeUInt32LE(val) {
    this._writeStandard(this.writeUInt32LE.name, val, 4);
  }

  writeUInt32BE(val) {
    this._writeStandard(this.writeUInt32BE.name, val, 4);
  }

  writeBytes(buffer) {
    buffer.copy(this.buffer, this.position);
    this.position += buffer.length;
  }

  _writeStandard(fn, val, len) {
    this.buffer[fn](val, this.position);
    this.position += len;
  }
}

module.exports = BufferWriter;
