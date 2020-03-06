import { BufferCursor } from "@lntools/buffer-cursor";
import * as crypto from "@lntools/crypto";
import { Bitmask } from "../bitmask";
import { deserializeAddress } from "../deserialize/address/deserialize-address";
import { Address } from "../domain/address";
import { MessageType } from "../message-type";
import { serializeAddress } from "../serialize/address/serialize-address";
import { IWireMessage } from "./wire-message";

/**
 * This gossip message allows a node to indicate extra data associated with it,
 * in addition to its public key. To avoid trivial denial of service attacks,
 * nodes not associated with an already known channel are ignored.
 */
export class NodeAnnouncementMessage implements IWireMessage {
  public static deserialize(payload: Buffer) {
    const instance = new NodeAnnouncementMessage();
    const reader = new BufferCursor(payload);
    reader.readUInt16BE(); // read off type

    instance.signature = reader.readBytes(64);

    const flen = reader.readUInt16BE();
    instance.features = Bitmask.fromBuffer(reader.readBytes(flen));

    instance.timestamp = reader.readUInt32BE();
    instance.nodeId = reader.readBytes(33);
    instance.rgbColor = reader.readBytes(3);
    instance.alias = reader.readBytes(32);
    instance.addresses = [];

    const addrlen = reader.readUInt16BE(); // number of bytes
    const startPos = reader.position;
    while (reader.position < startPos + addrlen) {
      const type = reader.readUInt8();
      const address = deserializeAddress(type, reader);
      instance.addresses.push(address);
    }

    return instance;
  }

  /**
   * Message hashing is after the first 66 bytes of the message
   * and excludes the type and signature. It performs a double
   * sha-256 hash of the remaining bytes.
   */
  public static hash(msg: NodeAnnouncementMessage): Buffer {
    const bytes = msg.serialize().slice(66); // type + signature
    return crypto.hash256(bytes);
  }

  /**
   * Verifies the message signature
   */
  public static verifySignatures(msg: NodeAnnouncementMessage): boolean {
    const hash = NodeAnnouncementMessage.hash(msg);
    return crypto.verifySig(hash, msg.signature, msg.nodeId);
  }

  /**
   * Type 257
   */
  public type: MessageType = MessageType.NodeAnnouncement;

  /**
   * Signature of the announcement message by the node's public key
   * returned as a 64-byte Buffer.
   */
  public signature: Buffer;

  public features: Bitmask;

  public timestamp: number;

  /**
   * Compressed public key of the node that is a 33-byte
   * buffer.
   */
  public nodeId: Buffer;

  /**
   * Color of the node returned as a 3-byte Buffer.
   */
  public rgbColor: Buffer;

  /**
   * Alias of the node returned as a 32-byte Buffer.
   */
  public alias: Buffer;

  /**
   * Addresses that the node allow public network connections
   * on. The type indicates how the address is encoded. Addresses
   * are in order of connectivity preference. Currently
   * supported addresses formats are IPv4, IPv6, Tor2 and Tor3
   */
  public addresses: Address[] = [];

  public serialize() {
    const featuresBuffer = this.features.toBuffer();
    const featuresLen = featuresBuffer.length;

    // serialize addresses into buffers so we can obtain the length
    const addressBuffers = [];
    for (const address of this.addresses) {
      addressBuffers.push(serializeAddress(address));
    }

    // obtain total address length
    const addressBytes = addressBuffers.map(b => b.length).reduce((sum, val) => sum + val, 0);

    const result = Buffer.alloc(
      2 +   // type
      64 +  // signature
      2 +   // flen
      featuresLen + // features length
      4 +   // timestamp
      33 +  // node_id
      3 +   // rgb_color
      32 +  // alias
      2 +   // addresses
      addressBytes, // cumulative addr bytes
    ); // prettier-ignore
    const writer = new BufferCursor(result);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.signature);
    writer.writeUInt16BE(featuresLen);
    if (featuresLen > 0) writer.writeBytes(featuresBuffer);
    writer.writeUInt32BE(this.timestamp);
    writer.writeBytes(this.nodeId);
    writer.writeBytes(this.rgbColor);
    writer.writeBytes(this.alias);
    writer.writeUInt16BE(addressBytes);
    for (const addressBuffer of addressBuffers) {
      writer.writeBytes(addressBuffer);
    }

    return result;
  }
}
