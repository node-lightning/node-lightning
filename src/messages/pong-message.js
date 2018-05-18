const BufferCursor = require('simple-buffer-cursor');

class PongMessage {
  constructor() {
    this.type = 19;
    this.ignored;
  }

  static deserialize(payload) {
    let instance = new PongMessage();
    let reader = BufferCursor.from(payload);
    reader.readUInt16BE();

    let byteslen = reader.readUInt16BE();
    instance.ignored = reader.readBytes(byteslen);
    return instance;
  }

  serialize() {
    let result = Buffer.alloc(4 + this.ignored.length);
    let writer = BufferCursor.from(result);
    writer.writeUInt16BE(this.type);
    writer.writeUInt16BE(this.ignored.length);
    writer.writeBytes(this.ignored);
    return result;
  }

  static createReply(ping) {
    let instance = new PongMessage();
    instance.ignored = Buffer.alloc(ping.num_pong_bytes);
    return instance;
  }
}

module.exports = PongMessage;
