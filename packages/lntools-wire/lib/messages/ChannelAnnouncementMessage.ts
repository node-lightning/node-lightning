import { BufferCursor } from "@lntools/buffer-cursor";
import * as crypto from "@lntools/crypto";
import { BitField } from "../BitField";
import { ChannelFeatureFlags } from "../flags/ChannelFeatureFlags";
import { MessageType } from "../message-type";
import { shortChannelIdFromBuffer } from "../shortchanid";
import { ShortChannelId } from "../shortchanid";
import { IWireMessage } from "./IWireMessage";

/**
 * Message contains ownership information regarding a channel.
 * It ties each on-chain Bitcoin key to the associated Lightning
 * node key, and vice-versa. Proviing the existance of a channel
 * between node_1 and node_2 requires:
 *   1. proving that the funding pays to bitcoin_key_1 and bitcoin_key_2
 *   2. proving that node_1 owns bitcoin_key_1
 *   3. proving that node_2 owns bitcoin_key_2
 *
 * This also varifies that both nodes want to announce the channel.
 * The required data to perform all of these proofs is available
 * in this message.
 */
export class ChannelAnnouncementMessage implements IWireMessage {
  /**
   * Deserializes the Buffer into a ChannelAnnouncementMessage.
   */
  public static deserialize(payload: Buffer): ChannelAnnouncementMessage {
    const instance = new ChannelAnnouncementMessage();
    const reader = new BufferCursor(payload);
    reader.readUInt16BE(); // read off type

    instance.nodeSignature1 = reader.readBytes(64);
    instance.nodeSignature2 = reader.readBytes(64);
    instance.bitcoinSignature1 = reader.readBytes(64);
    instance.bitcoinSignature2 = reader.readBytes(64);

    const len = reader.readUInt16BE();
    instance.features = BitField.fromBuffer(reader.readBytes(len));
    instance.chainHash = reader.readBytes(32);
    instance.shortChannelId = shortChannelIdFromBuffer(reader.readBytes(8));
    instance.nodeId1 = reader.readBytes(33);
    instance.nodeId2 = reader.readBytes(33);
    instance.bitcoinKey1 = reader.readBytes(33);
    instance.bitcoinKey2 = reader.readBytes(33);
    return instance;
  }

  /**
   * Message hashing is after the first 258 bytes of the message
   * and excludes the type and signatures. It performs a double
   * sha-256 hash of the remaining bytes.
   */
  public static hash(msg: ChannelAnnouncementMessage): Buffer {
    const bytes = msg.serialize().slice(258);
    return crypto.hash256(bytes);
  }

  /**
   * Performs validation the message was signed by each node and the
   * the corresponding bitcoin key is owned by the owner of the node.
   *
   * This is accomplished by:
   * 1. verifying the bitcoinSignatures1/2 are validate signatures
   *    from bitcoinKey1/2
   * 2. verifying the nodeSignature1/2 are validate signatures
   *     from nodeId1/2
   */
  public static verifySignatures(msg: ChannelAnnouncementMessage): boolean {
    const hash = ChannelAnnouncementMessage.hash(msg);
    return (
      crypto.verifySig(hash, msg.bitcoinSignature1, msg.bitcoinKey1) &&
      crypto.verifySig(hash, msg.bitcoinSignature2, msg.bitcoinKey2) &&
      crypto.verifySig(hash, msg.nodeSignature1, msg.nodeId1) &&
      crypto.verifySig(hash, msg.nodeSignature2, msg.nodeId2)
    );
  }

  /**
   * The message type - 256
   */
  public type: MessageType = MessageType.ChannelAnnouncement;

  /**
   * Validate signature from node_1 of the hash containing the
   * data: features, chainHash, shortChannelId, nodeId1,
   * nodeId1, bitcoinKey1, and bitcoinKey2.
   */
  public nodeSignature1: Buffer;

  /**
   * Validate signature from node_2 of the hash containing the
   * data: features, chainHash, shortChannelId, nodeId1,
   * nodeId1, bitcoinKey1, and bitcoinKey2.
   */
  public nodeSignature2: Buffer;

  /**
   * Validate signature from bitcoin_key_1 of the hash containing the
   * data: features, chainHash, shortChannelId, nodeId1,
   * nodeId1, bitcoinKey1, and bitcoinKey2.
   */
  public bitcoinSignature1: Buffer;

  /**
   * Validate signature from bitcoin_key_2 of the hash containing the
   * data: features, chainHash, shortChannelId, nodeId1,
   * nodeId1, bitcoinKey1, and bitcoinKey2.
   */
  public bitcoinSignature2: Buffer;

  /**
   * The channel features are a bitmask
   */
  public features: BitField<ChannelFeatureFlags>;

  /**
   * Must set chain_hash to a 32-byte hash that uniquely identifies
   * the chain that the channel opened within.
   */
  public chainHash: Buffer;

  /**
   * ShortChannelId is a unique reference to the funding output of the
   * channel.
   */
  public shortChannelId: ShortChannelId;

  /**
   * The 33-byte compressed public key identifying the
   * numerically greater of the two DER-encoded keys
   * sorted in ascending numerical order.
   */
  public nodeId1: Buffer;

  /**
   * The 33-byte compressed public key identifying the
   * numerically greater of the two DER-encoded keys
   * sorted in ascending numerical order.
   */
  public nodeId2: Buffer;

  /**
   * The 33-byte compressed Bitcoin public key used by
   * node_id_1 to create the funding transaction.
   */
  public bitcoinKey1: Buffer;

  /**
   * The 33-byte compressed Bitcoin public key used by
   * node_id_2 to create the funding transaction.
   */
  public bitcoinKey2: Buffer;

  /**
   * Serializes the intancee into a Buffer suitable
   * for wire transport
   */
  public serialize(): Buffer {
    const featuresBuffer = this.features.toBuffer();
    const featuresLen = featuresBuffer.length;
    const result = Buffer.alloc(
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
      33,    // bitcoin_key_2
    ); // prettier-ignore
    const writer = new BufferCursor(result);
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.nodeSignature1);
    writer.writeBytes(this.nodeSignature2);
    writer.writeBytes(this.bitcoinSignature1);
    writer.writeBytes(this.bitcoinSignature2);
    writer.writeUInt16BE(featuresLen);
    if (featuresLen > 0) writer.writeBytes(featuresBuffer);
    writer.writeBytes(this.chainHash);
    writer.writeBytes(this.shortChannelId.toBuffer());
    writer.writeBytes(this.nodeId1);
    writer.writeBytes(this.nodeId2);
    writer.writeBytes(this.bitcoinKey1);
    writer.writeBytes(this.bitcoinKey2);
    return result;
  }
}
