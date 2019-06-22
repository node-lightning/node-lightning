const BufferCursor = require('simple-buffer-cursor');
const BN = require('bn.js');
// const crypto = require('@lntools/crypto');

exports.ChannelUpdateMessage = class ChannelUpdateMessage {
  /**
    After a channel has been announced, each side independently announces the fees
    and minimum expiry delta it requires to relay HTLCs through this channel. A
    node can broadcast this message multiple times in order to change fees.
   */
  constructor() {
    /**
     Message type is 258
     @type {number}
     */
    this.type = 258;

    /**
      64-byte buffer containing the ECDSA secp256k1 signature of the double
      SHA256 hash of the message as signed by the originating node.

      @type {Buffer}
     */
    this.signature;

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
      Timestamp of the update message and is used to indicate ordering of
      messages if multiple messages are sent by the same node.

      @type {number}
     */
    this.timestamp;

    /**
      Indicate the presence of optional fields in the channel_update message.
        bit, field
        0, htlc_maximum_msat

      @type {number}
     */
    this.messageFlags;

    /**
      Indicates the direction of the channel: it identifies the node that this
      update originated from and signals various options concerning the channel
      such as whether it is disabled.
        bit, name
        0, direction
        1, disabled

      @type {number}
     */
    this.channelFlags;

    /**
      The number of blocks the channel will subtract from an incoming
      HTLC's cltv_expiry.

      @type {number}
     */
    this.cltvExpiryDelta;

    /**
      The minimum HTLC value (in millisatoshi) that the channel peer
      will accept.

      @type {BN}
     */
    this.htlcMinimumMsat;

    /**
      The maximum value (in millisatoshi) it will send through this
      channel for a single HTLC. This value must be less than the
      channel capacity. This value will only be available when the
      message flag option_channel_htlc_max is set.

      @type {BN}
     */
    this.htlcMaximumMsat;

    /**
      The base fee (in millisatoshi) the channel will charge for
      any HTLC.

      @type {number}
     */
    this.feeBaseMsat;

    /**
      The amount (in millionths of a satoshi) it will charge per
      transferred satoshi.

      @type {number}
     */
    this.feeProportionalMillionths;
  }

  /**
    Direction is determined by channel_flags bit 0.
    When set to 0, node_1 is the sender. When set to 1
    node_2 is the sender

    @type {number}
   */
  get direction() {
    return this.channelFlags & 0x1;
  }

  /**
    Disabled flag is determined by channel_flags bit 1.
    When set to 0, the channel is active. When set to 0
    the chanenl is disabled.

    @type {boolean}
   */
  get disabled() {
    return (this.channelFlags & 0x2) === 2;
  }

  /**
    Deserializes the message from a Buffer. The message
    is not validated in this function.

    @param {Buffer} payload
   */
  static deserialize(payload) {
    let instance = new ChannelUpdateMessage();
    let reader = BufferCursor.from(payload);
    reader.readUInt16BE(); // read off type

    instance.signature = reader.readBytes(64);
    instance.chainHash = reader.readBytes(32);
    instance.shortChannelId = reader.readBytes(8);
    instance.timestamp = reader.readUInt32BE();
    instance.messageFlags = reader.readUInt8();
    instance.channelFlags = reader.readUInt8();
    instance.cltvExpiryDelta = reader.readUInt16BE();
    instance.htlcMinimumMsat = new BN(reader.readBytes(8));
    instance.feeBaseMsat = reader.readUInt32BE();
    instance.feeProportionalMillionths = reader.readUInt32BE();

    // has optional_channel_htlc_max
    if ((instance.messageFlags & 0x1) === 1) {
      instance.htlcMaximumMsat = new BN(reader.readBytes(8));
    }

    // verify signature
    // let sigHash = this.hashForSignature();
    // secp256k1.verify(sigHash, instance.signature, )

    return instance;
  }

  // hashForSignature() {
  //   let raw = this.serialize();
  //   raw = raw.slice(2 + 64); // after signature
  //   return crypto.sha256(raw);
  // }

  serialize() {
    // TODO
    // let result = Buffer.alloc(123);
    // let writer = BufferCursor.from(result);
    // writer.writeUInt16BE(this.type);
    // writer.writeBytes(this.signature);
    // writer.writeBytes(this.chainHash);
    // writer.writeUInt8(this.shortChannelId);
    // writer.writeUInt32BE(this.timestamp);
    // writer.writeUInt16BE(this.flags);
    // writer.writeUInt16BE(this.cltvExpiryDelta);
    // writer.writeBytes(this.htlcMinimumMsat);
    // writer.writeUInt32BE(this.feeBaseMsat);
    // writer.writeUInt32BE(this.feeProportionalMillionths);
    // return result;
  }
};
