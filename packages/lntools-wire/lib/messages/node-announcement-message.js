const BufferCursor = require('simple-buffer-cursor');
const BN = require('bn.js');
const { MESSAGE_TYPE } = require('../constants');

class NodeAnnouncement {
  /**
    This gossip message allows a node to indicate extra data associated with it,
    in addition to its public key. To avoid trivial denial of service attacks,
    nodes not associated with an already known channel are ignored.
   */
  constructor() {
    /** @type number */
    this.type = MESSAGE_TYPE.NODE_ANNOUNCEMENT; // 257

    /** @type Buffer */
    this.signature;

    /** @type BN */
    this.features;
    this.timestamp;
    this.node_id;
    this.rgb_color;
    this.alias;
    this.addresses;
  }

  static deserialize(payload) {
    let instance = new NodeAnnouncement();
    let reader = BufferCursor.from(payload);
    reader.readUInt16BE(); // read off type

    instance.signature = reader.readBytes(64);

    let flen = reader.readUInt16BE();
    instance.features = new BN(reader.readBytes(flen));

    instance.timestamp = reader.readUInt32BE();
    instance.node_id = reader.readBytes(33);
    instance.rgb_color = reader.readBytes(3);
    instance.alias = reader.readBytes(32);

    let addrlen = reader.readUInt16BE();
    instance.addresses = reader.readBytes(addrlen);

    return instance;
  }

  serialize() {
    // todo
  }
}

module.exports = NodeAnnouncement;
