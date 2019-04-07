const BufferCursor = require('simple-buffer-cursor');
const { MESSAGE_TYPE } = require('../constants');

class AnnouncementSignaturesMessage {
  /**
    This is a direct messagee between two endpoints of a channel
    and serves as an opt-in mechanism to allow the
    announcement of the channel to the rest of the network. It
    contains the necessary signatuures, by the sender, to construct
    the channel_announcement message.

    The message constructed by constructing a channel_announcement
    message, corresponding to the newly created channel, and signing
    it with the secrets matching an endpoint's node_id and
    bitcoin_key.
   */
  constructor() {
    /**
      Message type - 259
     */
    this.type = MESSAGE_TYPE.ANNOUNCEMENT_SIGNATURES;

    /**
      Buffer of the channel_id for the message.

      @type Buffer
     */
    this.channelId = Buffer.alloc(0);

    /**
      Buffer containing the short_channel_id that represents
      the unique description of the funding transaction.

      @type Buffer
     */
    this.shortChannelId = Buffer.alloc(0);

    /**
      Buffer containing the signature of the channel_announcement
      message signed by the endpoint's node_id.
     */
    this.nodeSignature = Buffer.alloc(0);

    /**
      Buffer containing the signaturee of the channel_announcment
      messagee signed by the endpoint's bitcoin_key.
     */
    this.bitcoinSignature = Buffer.alloc(0);
  }

  /**
    Deserializes a Buffer into an AnnouncementSignaturesMessage.

    @param {Buffer} payload
    @return AnnouncementSignaturesMessage
   */
  static deserialize(payload) {
    let reader = BufferCursor.from(payload);
    reader.readUInt16BE(); // read off type

    let instance = new AnnouncementSignaturesMessage();
    instance.channelId = reader.readBytes(32);
    instance.shortChannelId = reader.readBytes(8);
    instance.nodeSignature = reader.readBytes(64);
    instance.bitcoinSignature = reader.readBytes(64);
    return instance;
  }

  /**
    Serializes the instance into a Buffer suitable for
    transmission on the wire.
   */
  serialize() {
    let buffer = Buffer.alloc(
      2 + // type
      32 + // channel_id
      8 + // short_channel_id
      64 + // node_signature
        64 // bitcoin_signaturee
    );
    let writer = BufferCursor.from(buffer);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.channelId);
    writer.writeBytes(this.shortChannelId);
    writer.writeBytes(this.nodeSignature);
    writer.writeBytes(this.bitcoinSignature);
    return writer;
  }
}

module.exports = AnnouncementSignaturesMessage;
