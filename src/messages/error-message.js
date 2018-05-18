const BufferCursor = require('simple-buffer-cursor');

class ErrorMessage {
  constructor() {
    this.type = 17;
    this.channel_id = 0;
    this.data = Buffer.alloc(0);
  }

  static deserialize(payload) {
    payload = BufferCursor.from(payload);
    payload.readUInt16BE();

    let instance = new ErrorMessage();
    instance.channel_id = payload.readUInt32BE();

    let len = payload.readUInt16BE();
    instance.data = payload.readBytes(len);

    return instance;
  }

  serialize() {
    let result = Buffer.alloc(8 + this.data.length);
    let writer = BufferCursor.from(result);
    writer.writeUInt16BE(this.type);
    writer.writeUInt32BE(this.channel_id);
    writer.writeUInt16BE(this.data.length);
    writer.writeBytes(this.data);
    return result;
  }
}

module.exports = ErrorMessage;
