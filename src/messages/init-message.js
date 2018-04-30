const BufferCursor = require('simple-buffer-cursor');

class InitMessage {
  constructor() {
    this.type = 16;
    this.globalFeatures = 0;
    this.localFeatures = 0;
  }

  static deserialize(payload) {
    payload = BufferCursor.from(payload);
    let instance = new InitMessage();
    instance.globalFeatures = payload.readUInt16BE();
    instance.localFeatures = payload.readUInt16BE();
    return instance;
  }

  serialize() {
    let result = BufferCursor.from(Buffer.alloc(6));
    result.writeUInt16BE(16);
    result.writeUInt16BE(this.globalFeatures);
    result.writeUInt16BE(this.localFeatures);
    return result.buffer;
  }
}

module.exports = InitMessage;
