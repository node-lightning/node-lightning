const BufferCursor = require('simple-buffer-cursor');
const { MESSAGE_TYPE } = require('../constants');

class ErrorMessage {
  /**
    This message is defined in BOLT #1 and is used for telling
    a peer that something is incorrect. The message can indicate
    which channel is in error, or if channelId is 0, it refers
    to all channels.

    These message can indicate protocol violations or internal
    errors that make channels unusable or that make further
    communication unusable.
   */
  constructor() {
    /**
      Message type 17

      @type number
     */
    this.type = MESSAGE_TYPE.ERROR;

    /**
      channelId is used to indicate the failing channel. It
      can have a value of 0 to indicate there is an error with
      all channels.

      All error messsagees sent before (and including) the
      funding_created messagee should use the temporary_channel_id
      instead of the channel_id.
     */
    this.channelId = 0;

    /**
      Data field may be empty. May contain the raw, hex-encoded
      transaction in reply to a invalid signature check in
      funding_created, funding_signed, closing_signed, or
      commitment_signed messages.
     */
    this.data = Buffer.alloc(0);
  }

  /**
    Deserializes an error message into an ErrorMessage
    instance.

    @param {Buffer} payload
    @return ErrorMessage
   */
  static deserialize(payload) {
    let reader = BufferCursor.from(payload);
    reader.readUInt16BE(); // read type

    let instance = new ErrorMessage();
    instance.channelId = reader.readUInt32BE();

    let len = reader.readUInt16BE();
    instance.data = reader.readBytes(len);

    return instance;
  }

  /**
    Serialize the ErorrMessage into a Buffer that
    can be send on the wire.

    @return Buffer
   */
  serialize() {
    let buffer = Buffer.alloc(
      2 + // type
      4 + // channel_id
      2 + // len
        this.data.length
    );
    let writer = BufferCursor.from(buffer);
    writer.writeUInt16BE(this.type);
    writer.writeUInt32BE(this.channelId);
    writer.writeUInt16BE(this.data.length);
    writer.writeBytes(this.data);
    return buffer;
  }
}

module.exports = {
  ErrorMessage,
};
