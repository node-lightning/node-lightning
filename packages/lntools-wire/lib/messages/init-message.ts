import { BufferCursor } from "@lntools/buffer-cursor";
import BN from "bn.js";
import * as bitwise from "../bitwise";
import { MESSAGE_TYPE } from "../message-type";
import { IWireMessage } from "./wire-message";

/**
 * InitMessage is defined in BOLT #1. Once authentication is complete,
 * the first message reveals the features supported or required by
 * the node sending the message. This message is sent even on
 * a reconnection.
 *
 * This message contains two fields; globalfeatures and localfeatures,
 * that are used to signal how the message should operate. The values
 * of are defined in the BOLT #9.
 */
export class InitMessage implements IWireMessage {
  /**
   * Deserializes a Buffer containing the message information. This
   * method will capture the arbitrary length global and local
   * features into two internal properties of the newly constructed
   * init message object.
   */
  public static deserialize(payload: Buffer): InitMessage {
    const reader = new BufferCursor(payload);
    reader.readUInt16BE(); // read off type

    const instance = new InitMessage();

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
    const gflen = reader.readUInt16BE();
    instance.globalFeatures = new BN(reader.readBytes(gflen));

    // Read the local length and parse into a BN value.
    const lflen = reader.readUInt16BE();
    instance.localFeatures = new BN(reader.readBytes(lflen));

    return instance;
  }

  /**
   * Message type 16
   */
  public type: MESSAGE_TYPE = MESSAGE_TYPE.INIT;
  public globalFeatures: BN = new BN(0);
  public localFeatures: BN = new BN(0);

  /**
   * Serialize will construct a properly formatted message
   * based on the properties of the configured message.
   */
  public serialize() {
    const gflen = this.globalFeatures.byteLength();
    const lflen = this.localFeatures.byteLength();

    // create a Buffer of the correct length that will
    // be returned after all data is written to the buffer.
    const buffer = Buffer.alloc(
      2 + // type (uint16be)
      2 + // length of glfen (uint16be)
      gflen +
      2 + // length of lflen (uint16be)
        lflen,
    );

    // use BufferCursor to make writing easier
    const cursor = new BufferCursor(buffer);

    // write the type
    cursor.writeUInt16BE(this.type);

    // write gflen
    cursor.writeUInt16BE(gflen);

    // Write the global features and ignore zero because
    // it will incorrectly push a 0-byte into the output.
    if (this.globalFeatures.byteLength() > 0) {
      cursor.writeBytes(this.globalFeatures.toBuffer("be"));
    }

    // Write the local features and ignore zero because
    // it will incorrectly push a 0-byte into the output.
    cursor.writeUInt16BE(this.localFeatures.byteLength());
    if (this.localFeatures.byteLength() > 0) {
      cursor.writeBytes(this.localFeatures.toBuffer("be"));
    }

    return buffer;
  }

  /**
   * Helper function that sets (enables) the bit in the
   * local features.
   */
  public setLocalBit(bit: number) {
    bitwise.isetn(this.localFeatures, bit);
  }

  /**
   * Helper function that unsets (disables) the bit in the
   * local features.
   */
  public unsetLocalBit(bit: number) {
    bitwise.iunsetn(this.localFeatures, bit);
  }

  /**
   * Gets if the option_data_loss_protect local flag is set. This
   * flag enables / requires the support of the extra
   * channel_reestablish fields defined in BOLT #2.
   *
   * Sets the option_data_loss_protect odd bit to the value
   * specified. option_data_loss_protect can use 0/1 flags. This
   * setter will ensure that only the odd bit is set.
   */
  get localDataLossProtect(): boolean {
    return this.localFeatures.testn(0) || this.localFeatures.testn(1);
  }

  set localDataLossProtect(val: boolean) {
    if (val) this.setLocalBit(1);
    else this.unsetLocalBit(1);
    this.unsetLocalBit(0);
  }

  /**
   * Gets the initial_routing_sync local flag. This flag asks
   * the remote node to send a complete routing information dump.
   * The initial_routing_sync feature is overridden (and should be
   * considered equal to 0) by the gossip_queries feature if the
   * latter is negotiated via init.
   *
   * Sets the initial_routing_sync local flag.
   */
  get localInitialRoutingSync(): boolean {
    return this.localFeatures.testn(3);
  }

  set localInitialRoutingSync(val: boolean) {
    if (val) this.setLocalBit(3);
    else this.unsetLocalBit(3);
  }

  /**
   * Gets the option_upfront_shutdown_script location flag. This flag
   * asks to commit to a shutdown scriptpubkey when opening a channel
   * as defined in BOLT #2.
   *
   * Sets the option_upfront_shutdown_script local flag. This flag
   * can be either 4 or 5. Use of the setter will set 5 and unset 4
   * to ensure both are not set.
   */
  get localUpfrontShutdownScript(): boolean {
    return this.localFeatures.testn(4) || this.localFeatures.testn(5);
  }

  set localUpfrontShutdownScript(val: boolean) {
    if (val) this.setLocalBit(5);
    else this.unsetLocalBit(5);
    this.unsetLocalBit(4);
  }

  /**
   * Gets the gossip_queries local flag. This flag signals that the node
   * wishes to use more advanced gossip control. When negotiated, this
   * flag will override the initial_routing_sync flag. Advanced
   * querying is defined in BOLT #7.
   *
   * Sets the gossip_queries flag. This flag can be either 6 or 7. Use
   * of the setter will set 7 and unset 6 to ensure both are not set.
   */
  get localGossipQueries(): boolean {
    return this.localFeatures.testn(6) || this.localFeatures.testn(7);
  }

  set localGossipQueries(val: boolean) {
    if (val) this.setLocalBit(7);
    else this.unsetLocalBit(7);
    this.unsetLocalBit(6);
  }

  get localGossipQueriesEx(): boolean {
    return this.localFeatures.testn(10) || this.localFeatures.testn(11);
  }

  set localGossipQueriesEx(val: boolean) {
    if (val) this.setLocalBit(11);
    else this.unsetLocalBit(11);
    this.unsetLocalBit(10);
  }

  public toJSON() {
    return {
      globalFeatures: this.globalFeatures.toString(),
      localFeatures: {
        raw: this.localFeatures.toString(),
        dataLossProtect: this.localDataLossProtect,
        initialRoutingSync: this.localInitialRoutingSync,
        upfrontShutdownScript: this.localUpfrontShutdownScript,
        gossipQueries: this.localGossipQueries,
      },
    };
  }

  public toString() {
    return this.serialize().toString("hex");
  }
}
