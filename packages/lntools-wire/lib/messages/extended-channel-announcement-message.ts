import BN = require("bn.js");
import { OutPoint } from "../domain/outpoint";
import { MESSAGE_TYPE } from "../message-type";
import { ShortChannelId } from "../shortchanid";
import { ChannelAnnouncementMessage } from "./channel-announcement-message";
import { IWireMessage } from "./wire-message";

/**
 * Decorator for the channel_announcement that includes the additional
 * information provided by the on-chain validation. Specifically, the
 * channel_announcement message only has a short_channel_id with block, tx num,
 * and vout num. We need to obtain the txid as well as the outpoint value to
 * determine the value of the channel.
 *
 * This information is stored in this decorator class which can be broadcast
 * and used downstream by clients that need both sets of information. Additionally
 * the use of this decorator allows us to store the on-chain data along side the
 * channel_announcement data if so desired.
 */
export class ExtendedChannelAnnouncementMessage extends ChannelAnnouncementMessage {
  /**
   * Constructs a new ExtendedChannelAnnouncementMessage from the plain-jane
   * ChannelAnnouncementMessage
   */
  public static fromMessage(msg: ChannelAnnouncementMessage) {
    const instance = new ExtendedChannelAnnouncementMessage();
    instance.bitcoinKey1 = msg.bitcoinKey1;
    instance.bitcoinKey2 = msg.bitcoinKey2;
    instance.bitcoinSignature1 = msg.bitcoinSignature1;
    instance.bitcoinSignature2 = msg.bitcoinSignature2;
    instance.chainHash = msg.chainHash;
    instance.features = msg.features;
    instance.nodeId1 = msg.nodeId1;
    instance.nodeId2 = msg.nodeId2;
    instance.nodeSignature1 = msg.nodeSignature1;
    instance.nodeSignature2 = msg.nodeSignature2;
    instance.shortChannelId = msg.shortChannelId;
    instance.type = msg.type;
    return instance;
  }

  /**
   * OutPoint for the channel that includes the transaction identifier as well
   * as the vout index. This information is obtained by finding the transaction
   * in a block based on the short_channel_id.
   */
  public outpoint: OutPoint;

  /**
   * Capacity of the funding transaction. This information is obtained from on-chain
   * validation of the transaction.
   */
  public capacity: bigint;
}
