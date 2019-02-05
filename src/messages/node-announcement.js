const BufferCursor = require('simple-buffer-cursor');

class NodeAnnouncement {
  constructor() {
    this.type = 257;
    this.signature;
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
    instance.signature = reader.readBytes(8);

    let flen = reader.readUInt16BE();
    instance.features = reader.readBytes(flen);

    instance.timestamp = reader.readUInt32BE();
    instance.node_id = reader.readBytes(33);
    instance.rgb_color = reader.readBytes(3);
    instance.alias = reader.readBytes(32).toString('utf8');

    let addrlen = reader.readUInt16BE();
    instance.addresses = reader.readBytes(addrlen);

    return instance;
  }

  serialize() {
    // todo
  }
}

module.exports = NodeAnnouncement;
