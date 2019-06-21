const BufferCursor = require('simple-buffer-cursor');
const BN = require('bn.js');
const { MESSAGE_TYPE } = require('../constants');

class NodeAnnouncementMessage {
  /**
    This gossip message allows a node to indicate extra data associated with it,
    in addition to its public key. To avoid trivial denial of service attacks,
    nodes not associated with an already known channel are ignored.
   */
  constructor() {
    /**
      Type 257

      @type number
    */
    this.type = MESSAGE_TYPE.NODE_ANNOUNCEMENT;

    /**
      Signature of the announcement message by the node's public key
      returned as a 64-byte Buffer.

      @type {Buffer}
    */
    this.signature;

    /** @type BN */
    this.features;

    /**

      @type number
    */
    this.timestamp;

    /**
      Compressed public key of the node that is a 33-byte
      buffer.

      @type {Buffer}
     */
    this.nodeId;

    /**
      Color of the node returned as a 3-byte Buffer.

      @type {Buffer}
     */
    this.rgbColor;

    /**
      Alias of the node returned as a 32-byte Buffer.
      @type {Buffer}
     */
    this.alias;

    this.addresses;
  }

  static deserialize(payload) {
    let instance = new NodeAnnouncementMessage();
    let reader = BufferCursor.from(payload);
    reader.readUInt16BE(); // read off type

    instance.signature = reader.readBytes(64);

    let flen = reader.readUInt16BE();
    instance.features = new BN(reader.readBytes(flen));

    instance.timestamp = reader.readUInt32BE();
    instance.nodeId = reader.readBytes(33);
    instance.rgbColor = reader.readBytes(3);
    instance.alias = reader.readBytes(32);

    let addrlen = reader.readUInt16BE();
    instance.addresses = reader.readBytes(addrlen);

    return instance;
  }

  serialize() {
    // TODO
  }
}

module.exports = {
  NodeAnnouncementMessage,
};
