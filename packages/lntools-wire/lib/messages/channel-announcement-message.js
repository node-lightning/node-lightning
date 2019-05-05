const BufferCursor = require('simple-buffer-cursor');
const { MESSAGE_TYPE } = require('../constants');
const BN = require('bn.js');

class ChannelAnnouncement {
  /**
    Messagee contains ownership information regarding a channel.
    It ties each on-chain Bitcoin key to the associated Lightning
    node key, and vice-versa. Proviing the existance of a channel
    between node_1 and node_2 requires:
      1. proving that the funding pays to bitcoin_key_1 and bitcoin_key_2
      2. proving that node_1 owns bitcoin_key_1
      3. proving that node_2 owns bitcoin_key_2
    This also varifies that both nodes want to announce the channel.
    The required data to perform all of these proofs is available
    in this message.
   */
  constructor() {
    /**
      The message type - 256
      @type {number}
     */
    this.type = MESSAGE_TYPE.CHANNEL_ANNOUNCEMENT;

    /**
      Validate signature from node_1 of the hash containing the
      data: features, chainHash, shortChannelId, nodeId1,
      nodeId1, bitcoinKey1, and bitcoinKey2.

      @type {Buffer}
     */
    this.nodeSignature1;

    /**
      Validate signature from node_2 of the hash containing the
      data: features, chainHash, shortChannelId, nodeId1,
      nodeId1, bitcoinKey1, and bitcoinKey2.

      @type Buffer
     */
    this.nodeSignature2;

    /**
      Validate signature from bitcoin_key_1 of the hash containing the
      data: features, chainHash, shortChannelId, nodeId1,
      nodeId1, bitcoinKey1, and bitcoinKey2.

      @type {Buffer}
     */
    this.bitcoinSignature1;

    /**
      Validate signature from bitcoin_key_2 of the hash containing the
      data: features, chainHash, shortChannelId, nodeId1,
      nodeId1, bitcoinKey1, and bitcoinKey2.

      @type {Buffer}
     */
    this.bitcoinSignature2;

    /**
      The channel features stored as a BN value.

      @type {BN}
     */
    this.features;

    /**
      Must set chain_hash to a 32-byte hash that uniquely identifies
      the chain that the channel opened within.

      @type {Buffer}
     */
    this.chainHash;

    /**
      8-byte Buffer that refers to the funding transaction used to
      create the channel.

      The format of the shortChannelId Buffer is:
        - blockheight: 3 bytes
        - txId: 3 bytes
        - output index: 2 bytes

      This property gets and sets a raw Buffer containing all
      parts.

      @type {Buffer}
     */
    this.shortChannelId;

    /**
      The 33-byte compressed public key identifying the
      numerically greater of the two DER-encoded keys
      sorted in ascending numerical order.

      @type {Buffer}
     */
    this.nodeId1;

    /**
      The 33-byte compressed public key identifying the
      numerically greater of the two DER-encoded keys
      sorted in ascending numerical order.

      @type {Buffer}
     */
    this.nodeId2;

    /**
      The 33-byte compressed Bitcoin public key used by
      node_id_1 to create the funding transaction.

      @type {Buffer}
     */
    this.bitcoinKey1;

    /**
      The 33-byte compressed Bitcoin public key used by
      node_id_2 to create the funding transaction.

      @type {Buffer}
     */
    this.bitcoinKey2;
  }

  /**
    Deserializes the Buffer into a ChannelAnnouncement message.

    @param {Buffer} payload
    @returns {ChannelAnnouncement}
   */
  static deserialize(payload) {
    let instance = new ChannelAnnouncement();
    let reader = BufferCursor.from(payload);
    reader.readUInt16BE(); // read off type

    instance.nodeSignature1 = reader.readBytes(64);
    instance.nodeSignature2 = reader.readBytes(64);
    instance.bitcoinSignature1 = reader.readBytes(64);
    instance.bitcoinSignature2 = reader.readBytes(64);

    let len = reader.readUInt16BE();
    instance.features = new BN(reader.readBytes(len));
    instance.chainHash = reader.readBytes(32);
    instance.shortChannelId = reader.readBytes(8);
    instance.nodeId1 = reader.readBytes(33);
    instance.nodeId2 = reader.readBytes(33);
    instance.bitcoinKey1 = reader.readBytes(33);
    instance.bitcoinKey2 = reader.readBytes(33);
    return instance;
  }

  /**
    Serializes the intancee into a Buffer suitable
    for wire transport

    @returns {Buffer}
   */
  serialize() {
    let featuresBuffer = this.features.toBuffer('be');
    let featuresLen = this.features.gtn(0) ? featuresBuffer.length : 0;
    let result = Buffer.alloc(
      2 +   // type
      64 +  // node_signature_1
      64 +  // node_signature_2
      64 +  // bitcoin_signature_1
      64 +  // bitcoin_signature_2
      2 +   // len
      featuresLen +
      32 +  // chain_hash
      8 +   // short_channel_id
      33 +  // node_id_1
      33 +  // node_id_2
      33 +  // bitcoin_key_1
      33    // bitcion_key_2
    ); // prettier-ignore
    let writer = BufferCursor.from(result);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.nodeSignature1);
    writer.writeBytes(this.nodeSignature2);
    writer.writeBytes(this.bitcoinSignature1);
    writer.writeBytes(this.bitcoinSignature2);
    writer.writeUInt16BE(featuresLen);
    if (featuresLen > 0) writer.writeBytes(featuresBuffer);
    writer.writeBytes(this.chainHash);
    writer.writeBytes(this.shortChannelId);
    writer.writeBytes(this.nodeId1);
    writer.writeBytes(this.nodeId2);
    writer.writeBytes(this.bitcoinKey1);
    writer.writeBytes(this.bitcoinKey2);
    return result;
  }
}

module.exports = ChannelAnnouncement;
