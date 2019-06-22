const BufferCursor = require('simple-buffer-cursor');
const { MESSAGE_TYPE, PONG_BYTE_THRESHOLD } = require('../constants');

exports.PingMessage = class PingMessage {
  /**
    In order to allow for the existence of long-lived TCP
    connections,  at times it may be required that both ends keep
    alive the TCP connection at the application level.

    The ping message is sent by an initiator and includes a value
    for the number of pong bytes it expects to receive as
    a reply. The ignored bits should be set to 0.
   */
  constructor() {
    /**
      Ping message type is 18
      @type number
     */
    this.type = MESSAGE_TYPE.PING;

    /**
      The number of bytes that should be returned in the pong message.
      Can be set to 65532 to indicate that no pong message should be
      sent. Setting to any number below 65532 will require a pong
      matching the corresponding number of bytes. If the reply
      byteslen does not match this, you may terminate the channels
      with the client.

      @type number
     */
    this.numPongBytes = 1;

    /**
      Should set ignored to 0s. Must not set ignored to
      sensitive data such as secrets or portions of initialized
      memory.

      @type Buffer
     */
    this.ignored = Buffer.alloc(0);
  }

  /**
    Deserialize a message and return a new instance of the
    PingMessage type.

    @param {Buffer} payload
    @return PingMessage
   */
  static deserialize(payload) {
    let cursor = BufferCursor.from(payload);
    cursor.readUInt16BE();

    let instance = new PingMessage();
    instance.numPongBytes = cursor.readUInt16BE();

    let bytesLength = cursor.readUInt16BE();

    instance.ignored = cursor.readBytes(bytesLength);
    return instance;
  }

  /**
    Serialize the PingMessage and return a Buffer
    @return Buffer
   */
  serialize() {
    let buffer = Buffer.alloc(
      2 + // type
      2 + // num_pong_bytes
      2 + // byteslen
        this.ignored.length
    );
    let cursor = BufferCursor.from(buffer);
    cursor.writeUInt16BE(this.type);
    cursor.writeUInt16BE(this.numPongBytes);
    cursor.writeUInt16BE(this.ignored.length);
    cursor.writeBytes(this.ignored);
    return buffer;
  }

  /**
    triggersReply indicates if a pong message must send a reply.
    Ping messages than are smaller than 65532 must send a reply
    with the corresponding number of bytes. Above this value
    no reply is necessary.  Refer to BOLT #1.
   */
  get triggersReply() {
    return this.numPongBytes < PONG_BYTE_THRESHOLD;
  }
};
