const BufferCursor = require('simple-buffer-cursor');
const BN = require('bn.js');

class InitMessage {
  constructor() {
    this.type = 16;
    this.globalFeatures = new BN(0);
    this.localFeatures = new BN(0);
  }

  static deserialize(payload) {
    payload = BufferCursor.from(payload);
    payload.readUInt16BE(); // read off type

    let instance = new InitMessage();
    let gflen = payload.readUInt16BE();
    instance.globalFeatures = new BN(payload.readBytes(gflen));

    let lflen = payload.readUInt16BE();
    instance.localFeatures = new BN(payload.readBytes(lflen));

    // instance.option_data_loss_protect =
    //   instance.localFeatures.and(new BN(2 ** 0)).gtn(0) ||
    //   instance.localFeatures.and(new BN(2 ** 1)).gtn(0);
    // instance.initialRoutingSync = instance.localFeatures.and(new BN(2 ** 3)).gtn(0);
    // instance.option_upfront_shutdown_script =
    //   instance.localFeatures.and(new BN(2 ** 4)).gtn(0) ||
    //   instance.localFeatures.and(new BN(2 ** 5)).gtn(0);
    // instance.gossip_queries =
    //   instance.localFeatures.and(new BN(2 ** 6)).gtn(0) ||
    //   instance.localFeatures.and(new BN(2 ** 7)).gtn(0);

    return instance;
  }

  serialize() {
    let gflen = this.globalFeatures.byteLength();
    let lflen = this.localFeatures.byteLength();

    let result = BufferCursor.from(Buffer.alloc(2 + 2 + gflen + 2 + lflen));
    result.writeUInt16BE(this.type);

    result.writeUInt16BE(this.globalFeatures.byteLength());
    if (this.globalFeatures.byteLength() > 0) {
      result.writeBytes(this.globalFeatures.toBuffer('be'));
    }

    result.writeUInt16BE(this.localFeatures.byteLength());
    if (this.localFeatures.byteLength() > 0) {
      result.writeBytes(this.localFeatures.toBuffer('be'));
    }
    return result.buffer;
  }
}

module.exports = InitMessage;
