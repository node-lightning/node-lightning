class AnnouncementSignaturesMessage {
  constructor() {
    this.type = 259;
    this.channel_id;
    this.short_channel_id;
    this.node_signature;
    this.bitcoin_signature;
  }

  static deserialize(payload) {
    let instance = new AnnouncementSignaturesMessage();
    instance.channel_id = payload.readUInt32BE(0); // 4 bytes
    instance.short_channel_id = payload.readUInt8(4); // 1 bytes
    instance.node_signature = payload.slice(5, 13); // 8 bytes
    instance.bitcoin_signature = payload.slice(13, 21); // 8 bytes
    return instance;
  }

  serialize() {
    let result = Buffer.alloc(23);
    result.writeUInt16BE(this.type, 0); // 2 bytes
    result.writeUInt32BE(this.channel_id, 2); // 4 bytes
    result.writeUInt8(this.short_channel_id, 6); // 1 byte
    this.node_signature.copy(result, 7); // 8 bytes
    this.bitcoin_signature.copy(result, 15); // 8 bytes
    return result;
  }
}

module.exports = AnnouncementSignaturesMessage;
