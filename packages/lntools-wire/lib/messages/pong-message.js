const BufferCursor = require('simple-buffer-cursor');
const { MESSAGE_TYPE } = require('../constants');

exports.PongMessage = class PongMessage {
  /**
    In order to allow for the existence of long-lived TCP
    connections, at times it may be required that both ends keep
    alive the TCP connection at the application level.

    The pong message is a reply to a ping message and must
    reply with the specify number of bytes when the num_pong_bytes
    value is less than 65532.
    for the number of pong bytes it expects to receive as
    a reply. The ignored bits should be set to 0.
   */
  constructor(numPongBytes = 0) {
    /**
      Message type = 19
      @type number
     */
    this.type = MESSAGE_TYPE.PONG;

    /**
      Should be set to zeros of length specified in a ping message's
      num_pong_bytes. Must not set ignored to sensitive data such as
      secrets or portions of initialized memory.
      @type Buffer
     */
    this.ignored = Buffer.alloc(numPongBytes);
  }

  /**
    Deserializes a pong message from a Buffer into a PongMessage
    instance.

    @param {Buffer} payload
    @return {PongMessage}
   */
  static deserialize(payload) {
    let instance = new PongMessage();

    let reader = BufferCursor.from(payload);
    reader.readUInt16BE(); // read off type

    let byteslen = reader.readUInt16BE();
    instance.ignored = reader.readBytes(byteslen);
    return instance;
  }

  /**
    Serializes a PongMessage into a Buffer that can be
    streamed on the wire.

    @returns {Buffer}
   */
  serialize() {
    let buffer = Buffer.alloc(
      2 + // type
      2 + // byteslen
        +this.ignored.length
    );
    let writer = BufferCursor.from(buffer);
    writer.writeUInt16BE(this.type);
    writer.writeUInt16BE(this.ignored.length);
    writer.writeBytes(this.ignored);
    return buffer;
  }
};
