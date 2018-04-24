class InitMessage {
  constructor() {
    this.type = 16;
    this.globalFeatures = 0;
    this.localFeatures = 0;
  }

  static deserialize(payload) {
    let instance = new InitMessage();
    instance.globalFeatures = payload.readUInt16BE(0);
    instance.localFeatures = payload.readUInt16BE(2);
    return instance;
  }

  serialize() {
    let result = Buffer.alloc(6);
    result.writeUInt16BE(16, 0);
    result.writeUInt16BE(this.globalFeatures, 2);
    result.writeUInt16BE(this.localFeatures, 4);
    return result;
  }
}

module.exports = InitMessage;
