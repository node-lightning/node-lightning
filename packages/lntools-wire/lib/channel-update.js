const BufferCursor = require('simple-buffer-cursor');

class ChannelUpdate {
  constructor() {
    this.type = 258;
    this.signature;
    this.chain_hash;
    this.short_channel_id;
    this.timestamp;
    this.flags;
    this.cltv_expiry_delta;
    this.htlc_expiry_delta;
    this.htlc_minimum_msat;
    this.fee_base_msat;
    this.fee_proportional_millionths;
  }

  static deserialize(payload) {
    let instance = new ChannelUpdate();
    let reader = BufferCursor.from(payload);
    reader.readUInt16BE(); // read off type

    instance.signature = reader.readBytes(64);
    instance.chain_hash = reader.readBytes(32);
    instance.short_channel_id = reader.readBytes(8);
    instance.timestamp = reader.readUInt32BE();
    instance.flags = reader.readUInt16BE();
    instance.cltv_expiry_delta = reader.readUInt16BE();
    instance.htlc_minimum_msat = reader.readBytes(8);
    instance.fee_base_msat = reader.readUInt32BE();
    instance.fee_proportional_millionths = reader.readUInt32BE();
    return instance;
  }

  serialize() {
    let result = Buffer.alloc(123);
    let writer = BufferCursor.from(result);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.signature);
    writer.writeBytes(this.chain_hash);
    writer.writeUInt8(this.short_channel_id);
    writer.writeUInt32BE(this.timestamp);
    writer.writeUInt16BE(this.flags);
    writer.writeUInt16BE(this.cltv_expiry_delta);
    writer.writeBytes(this.htlc_minimum_msat);
    writer.writeUInt32BE(this.fee_base_msat);
    writer.writeUInt32BE(this.fee_proportional_millionths);
    return result;
  }
}

module.exports = ChannelUpdate;
