const BufferCursor = require('simple-buffer-cursor');

class PingMessage {
  constructor() {
    this.type = 18;
    this.num_pong_bytes = 1;
    this.ignored = Buffer.alloc(0);
  }

  static deserialize(payload) {
    payload = BufferCursor.from(payload);
    payload.readUInt16BE();

    let instance = new PingMessage();
    instance.num_pong_bytes = payload.readUInt16BE();

    let bytesLength = payload.readUInt16BE();

    instance.ignored = payload.readBytes(bytesLength);
    return instance;
  }

  serialize() {
    let result = BufferCursor.from(Buffer.alloc(6 + this.ignored.length));
    result.writeUInt16BE(this.type);
    result.writeUInt16BE(this.num_pong_bytes);
    result.writeUInt16BE(this.ignored.length);
    result.writeBytes(this.ignored);
    return result.buffer;
  }
}

module.exports = PingMessage;
