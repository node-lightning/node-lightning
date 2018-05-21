class BitCursor {
  constructor(buffer) {
    this.buffer = buffer;
    this.bitPosition = 0;
  }

  static from(buffer) {
    return new BitCursor(buffer);
  }

  get bitsRemaining() {
    return this.buffer.length * 8 - this.bitPosition;
  }

  get readByteIndex() {
    return ~~(this.bitPosition / 8);
  }

  readBits(bits, truncateByteExcess = false) {
    let result = Buffer.alloc(Math.ceil(bits / 8));

    let writeBitIndex = 0;
    while (writeBitIndex < bits) {
      let readBitIndexInByte = this.bitPosition % 8;
      let readByteIndex = ~~(this.bitPosition / 8);

      let writeBitIndexInByte = writeBitIndex % 8;
      let writeByteIndex = ~~(writeBitIndex / 8);

      let remBits = bits - writeBitIndex;
      let readBitChunk = Math.min(remBits, 8 - writeBitIndexInByte, 8 - readBitIndexInByte);

      let readByte = this.buffer[readByteIndex];
      let readBits =
        readBitIndexInByte === 0
          ? this._readLeftBits(readByte, readBitChunk)
          : this._readRightBits(readByte, readBitChunk);

      // shift the bits into the correct leftmost position
      readBits <<= 8 - (writeBitIndexInByte + readBitChunk);

      // add the read bits to the right side of the byte
      result[writeByteIndex] += readBits;

      writeBitIndex += readBitChunk;
      this.bitPosition += readBitChunk;
    }

    if (truncateByteExcess) {
      if (bits % 8 > 0) {
        result = result.slice(0, result.length - 1);
      }
    }

    return result;
  }

  _readLeftBits(byte, len) {
    return byte >> (8 - len);
  }

  _readRightBits(byte, len) {
    return byte & ((1 << len) - 1);
  }

  readUIntBE(bits) {
    let result = 0;
    let remBits = bits;

    while (remBits > 0) {
      let bitPositionInByte = this.bitPosition % 8;
      let bytePosition = ~~(this.bitPosition / 8);
      let byte = this.buffer[bytePosition];

      let bitChunk =
        remBits > 8 || remBits > 8 - bitPositionInByte ? 8 - bitPositionInByte : remBits;

      result = result << bitChunk;

      if (bitPositionInByte === 0 && bitChunk === 8) result += byte;
      else if (bitPositionInByte === 0) result += byte >> (8 - bitChunk);
      else {
        let excess = 8 - bitChunk - bitPositionInByte;
        let numRightBits = 8 - bitPositionInByte;
        result += (byte & ((1 << numRightBits) - 1)) >> excess;
      }

      this.bitPosition += bitChunk;
      remBits -= bitChunk;
    }

    return result;
  }

  currentByte(full) {
    if (full) return this.buffer[this.readByteIndex];
    else {
      let byte = this.buffer[this.readByteIndex];
      let bitsRemaining = 8 - this.bitPosition % 8;
      return byte & ((1 << bitsRemaining) - 1);
    }
  }

  currentByteToString(full) {
    let actual = this.currentByte(full);
    return actual.toString(2).padStart(full ? 8 : 8 - this.bitPosition % 8, '0');
  }
}

module.exports = BitCursor;
