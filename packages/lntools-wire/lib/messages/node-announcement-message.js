// @ts-check

const BufferCursor = require('simple-buffer-cursor');
const crypto = require('@lntools/crypto');
const BN = require('bn.js');
const { MESSAGE_TYPE } = require('../constants');
const { deserializeAddress } = require('../deserialize/address/deserialize-address');
const { serializeAddress } = require('../serialize/address/serialize-address');

/**
  @typedef {import("../domain/address").Address} Address
 */

exports.NodeAnnouncementMessage = class NodeAnnouncementMessage {
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

    /**
      Addresses that the node allow public network connections
      on. The type indicates how the address is encoded. Addresses
      are in order of connectivity preference. Currently
      supported addresses formats are IPv4, IPv6, Tor2 and Tor3
      @type {Array<Address>}
     */
    this.addresses = [];
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
    instance.addresses = [];

    let addrlen = reader.readUInt16BE(); // number of bytes
    let startPos = reader.position;
    while (reader.position < startPos + addrlen) {
      let type = reader.readUInt8();
      let address = deserializeAddress(type, reader);
      instance.addresses.push(address);
    }

    return instance;
  }

  serialize() {
    let featuresBuffer = this.features.toBuffer('be');
    let featuresLen = this.features.gtn(0) ? featuresBuffer.length : 0;

    // serialize addresses into buffers so we can obtain the length
    let addressBuffers = [];
    for (let address of this.addresses) {
      addressBuffers.push(serializeAddress(address));
    }

    // obtain total address length
    let addressBytes = addressBuffers.map(b => b.length).reduce((sum, val) => sum + val, 0);

    let result = Buffer.alloc(
      2 +   // type
      64 +  // signature
      2 +   // flen
      featuresLen + // features length
      4 +   // timestamp
      33 +  // node_id
      3 +   // rgb_color
      32 +  // alias
      2 +   // addresses
      addressBytes // cumulative addr bytes
    ); // prettier-ignore
    let writer = BufferCursor.from(result);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.signature);
    writer.writeUInt16BE(featuresLen);
    if (featuresLen > 0) writer.writeBytes(featuresBuffer);
    writer.writeUInt32BE(this.timestamp);
    writer.writeBytes(this.nodeId);
    writer.writeBytes(this.rgbColor);
    writer.writeBytes(this.alias);
    writer.writeUInt16BE(addressBytes);
    for (let addressBuffer of addressBuffers) {
      writer.writeBytes(addressBuffer);
    }

    return result;
  }

  /**
    Message hashing is after the first 66 bytes of the message
    and excludes the type and signature. It performs a double
    sha-256 hash of the remaining bytes.
    @param {NodeAnnouncementMessage} msg
    @returns {Buffer}
   */
  static hash(msg) {
    let bytes = msg.serialize().slice(66); // type + signature
    return crypto.hash256(bytes);
  }

  /**
    Verifies the message signature
    @param {NodeAnnouncementMessage} msg
    @returns {boolean}
   */
  static verifySignatures(msg) {
    let hash = NodeAnnouncementMessage.hash(msg);
    return crypto.verifySig(hash, msg.signature, msg.nodeId);
  }
};
