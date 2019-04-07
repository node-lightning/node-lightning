const BufferCursor = require('simple-buffer-cursor');
const BN = require('bn.js');
const bitwise = require('../bitwise');
const { MESSAGE_TYPE } = require('../constants');

class InitMessage {
  /**
    InitMessage is defined in BOLT #1. Once authentication is complete,
    the first message reveals the features supported or required by
    the node sending the message. This message is sent even on
    a reconnection.

    This message contains two fields; globalfeatures and localfeatures,
    that are used to signal how the message should operate. The values
    of are defined in the BOLT #9.
  */
  constructor() {
    this.type = MESSAGE_TYPE.INIT; // 16

    this.globalFeatures = new BN(0);
    this.localFeatures = new BN(0);
  }

  /**
    Deserializes a Buffer containing the message information. This
    method will capture the arbitrary length global and local
    features into two internal properties of the newly constructed
    init message object.

    @param {Buffer} payload
    @return {InitMessage}
   */
  static deserialize(payload) {
    payload = BufferCursor.from(payload);
    payload.readUInt16BE(); // read off type

    let instance = new InitMessage();

    // We will use BN to store our values and perform bitwise
    // operations to ensure we don't overflow the
    // JavaScript number which limits our bitwise operations to
    // 32-bits. Refer to https://mzl.la/1lt09c4
    //
    // While it would be nice to use native operators, for the
    // purposes of this library we need to assume that a
    // malicious actor could send an init packet with any length
    // feature.

    // Read the global length and parse into a BN value.
    let gflen = payload.readUInt16BE();
    instance.globalFeatures = new BN(payload.readBytes(gflen));

    // Read the local length and parse into a BN value.
    let lflen = payload.readUInt16BE();
    instance.localFeatures = new BN(payload.readBytes(lflen));

    return instance;
  }

  /**
    Serialize will construct a properly formatted message
    based on the properties of the configured message.
   */
  serialize() {
    let gflen = this.globalFeatures.byteLength();
    let lflen = this.localFeatures.byteLength();

    // create a Buffer of the correct length that will
    // be returned after all data is written to the buffer.
    let buffer = Buffer.alloc(
      2 + // type (uint16be)
      2 + // length of glfen (uint16be)
      gflen +
      2 + // length of lflen (uint16be)
        lflen
    );

    // use BufferCursor to make writing easier
    let cursor = BufferCursor.from(buffer);

    // write the type
    cursor.writeUInt16BE(this.type);

    // write gflen
    cursor.writeUInt16BE(gflen);

    // Write the global features and ignore zero because
    // it will incorrectly push a 0-byte into the output.
    if (this.globalFeatures.byteLength() > 0) {
      cursor.writeBytes(this.globalFeatures.toBuffer('be'));
    }

    // Write the local features and ignore zero because
    // it will incorrectly push a 0-byte into the output.
    cursor.writeUInt16BE(this.localFeatures.byteLength());
    if (this.localFeatures.byteLength() > 0) {
      cursor.writeBytes(this.localFeatures.toBuffer('be'));
    }

    return buffer;
  }

  /**
    Helper function that sets (enables) the bit in the
    local features.

    @param {number} bit
   */
  setLocalBit(bit) {
    bitwise.isetn(this.localFeatures, bit);
  }

  /**
    Helper function that unsets (disables) the bit in the
    local features.

    @param {number} bit
   */
  unsetLocalBit(bit) {
    bitwise.iunsetn(this.localFeatures, bit);
  }

  /**
    Gets if the option_data_loss_protect local flag is set. This
    flag enables / requires the support of the extra
    channel_reestablish fields defined in BOLT #2.

    Sets the option_data_loss_protect odd bit to the value
    specified. option_data_loss_protect can use 0/1 flags. This
    setter will ensure that only the odd bit is set.

    @type boolean
   */
  get localDataLossProtect() {
    return this.localFeatures.testn(0) || this.localFeatures.testn(1);
  }

  set localDataLossProtect(val) {
    if (val) this.setLocalBit(1);
    else this.unsetLocalBit(1);
    this.unsetLocalBit(0);
  }

  /**
    Gets the initial_routing_sync local flag. This flag asks
    the remote node to send a complete routing information dump.
    The initial_routing_sync feature is overridden (and should be
    considered equal to 0) by the gossip_queries feature if the
    latter is negotiated via init.

    Sets the initial_routing_sync local flag.

    @type boolean
   */
  get localInitialRoutingSync() {
    return this.localFeatures.testn(3);
  }

  set localInitialRoutingSync(val) {
    if (val) this.setLocalBit(3);
    else this.unsetLocalBit(3);
  }

  /**
    Gets the option_upfront_shutdown_script location flag. This flag
    asks to commit to a shutdown scriptpubkey when opening a channel
    as defined in BOLT #2.

    Sets the option_upfront_shutdown_script local flag. This flag
    can be either 4 or 5. Use of the setter will set 5 and unset 4
    to ensure both are not set.

    @type boolean
   */
  get localUpfrontShutdownScript() {
    return this.localFeatures.testn(4) || this.localFeatures.testn(5);
  }

  set localUpfrontShutdownScript(val) {
    if (val) this.setLocalBit(5);
    else this.unsetLocalBit(5);
    this.unsetLocalBit(4);
  }

  /**
    Gets the gossip_queries local flag. This flag signals that the node
    wishes to use more advanced gossip control. When negotiated, this
    flag will override the initial_routing_sync flag. Advanced
    querying is defined in BOLT #7.

    Sets the gossip_queries flag. This flag can be either 6 or 7. Use
    of the setter will set 7 and unset 6 to ensure both are not set.

    @type boolean
   */
  get localGossipQueries() {
    return this.localFeatures.testn(6) || this.localFeatures.testn(7);
  }

  set localGossipQueries(val) {
    if (val) this.setLocalBit(7);
    else this.unsetLocalBit(7);
    this.unsetLocalBit(6);
  }
}

module.exports = InitMessage;
