import { EventEmitter } from "events";
import { AsyncProcessingQueue } from "../AsyncProcessingQueue";
import { OutPoint } from "../domain/outpoint";
import { ChannelAnnouncementMessage } from "../messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "../messages/ChannelUpdateMessage";
import { ExtendedChannelAnnouncementMessage } from "../messages/ExtendedChannelAnnouncementMessage";
import { IWireMessage } from "../messages/IWireMessage";
import { NodeAnnouncementMessage } from "../messages/NodeAnnouncementMessage";
import { MessageType } from "../MessageType";
import { fundingScript } from "../ScriptUtils";
import { WireError, WireErrorCode } from "../WireError";
import { IGossipStore } from "./GossipStore";
import { IGossipFilterChainClient } from "./IGossipFilterChainClient";

// tslint:disable-next-line: interface-name
export declare interface GossipFilter {
  on(event: "flushed", fn: () => void): this;
  on(event: "flushing", fn: () => void): this;
  on(event: "message", fn: (msg: IWireMessage) => void): this;
  on(event: "error", fn: (err: WireError) => void): this;
}

/**
 * GossipFilter recieves messages from peers and performs validation
 * on the messages to ensure that they are valid messages. These validation
 * follow messaging rules defined in Bolt #7 and include things like
 * signature checks, on-chain validation, and message sequencing requirements.
 * Successful message validation results in messages being written to an
 * instance of IGossipStore and emitted since GossipFilter is an
 * IGossipEmitter.
 *
 * The GossipFilter will also store pending messages, such as channel_update
 * message arriving before the channel_announcement.
 */
export class GossipFilter extends EventEmitter {
  public syncHeight: number = 0;
  private _chainClient: IGossipFilterChainClient;
  private _gossipStore: IGossipStore;
  private _pendingStore: IGossipStore;

  private _processingQueue: AsyncProcessingQueue<IWireMessage>;

  constructor({
    chainClient,
    gossipStore,
    pendingStore,
  }: {
    gossipStore: IGossipStore;
    pendingStore: IGossipStore;
    chainClient?: IGossipFilterChainClient;
  }) {
    super();
    this._gossipStore = gossipStore;
    this._pendingStore = pendingStore;
    this._chainClient = chainClient;

    this.enqueue = this.enqueue.bind(this);
    this._validateMessage = this._validateMessage.bind(this);
    this._processingQueue = new AsyncProcessingQueue<IWireMessage>(this._validateMessage);
    this._processingQueue.on("flushing", () => this.emit("flushing"));
    this._processingQueue.on("flushed", () => this.emit("flushed"));
  }

  /**
   * Enqueues a raw message for processing
   */
  public enqueue(msg: IWireMessage) {
    // ignore messages that do not contain p2p graph data
    if (
      msg.type !== MessageType.ChannelAnnouncement &&
      msg.type !== MessageType.ChannelUpdate &&
      msg.type !== MessageType.NodeAnnouncement
    ) {
      return;
    }

    // defer processing until there is capacity
    this._processingQueue.enqueue(msg);
  }

  /**
   * Returns the number of queued messages waiting to be processed
   */
  public get size(): number {
    return this._processingQueue.size;
  }

  /**
   * Processes a message
   */
  private async _validateMessage(msg: IWireMessage) {
    switch (msg.type) {
      case MessageType.ChannelAnnouncement:
        await this._validateChannelAnnouncement(msg as ChannelAnnouncementMessage);
        break;
      case MessageType.NodeAnnouncement:
        await this._validateNodeAnnouncement(msg as NodeAnnouncementMessage);
        break;
      case MessageType.ChannelUpdate:
        await this._validateChannelUpdate(msg as ChannelUpdateMessage);
        break;
    }
  }

  /**
   * Validate a node announcement message by checking to see if the
   * message is newer than the prior timestamp and if the message
   * has a valid signature from the corresponding node
   */
  private async _validateNodeAnnouncement(msg: NodeAnnouncementMessage) {
    // get or construct a node
    const existing = await this._gossipStore.findNodeAnnouncement(msg.nodeId);

    // check if the message is newer than the last update
    if (existing && existing.timestamp >= msg.timestamp) return;

    // queue node if we don't have any channels
    const scids = await this._gossipStore.findChannelsForNode(msg.nodeId);
    if (!scids.length) {
      await this._pendingStore.saveNodeAnnouncement(msg);
      return;
    }

    // validate message signature
    if (!NodeAnnouncementMessage.verifySignatures(msg)) {
      this.emit("error", new WireError(WireErrorCode.nodeAnnSigFailed, [msg]));
      return;
    }

    // save the announcement
    await this._gossipStore.saveNodeAnnouncement(msg);

    // broadcast valid message
    this.emit("message", msg);
  }

  /**
   * Validates a ChannelAnnouncementMessage by verifying the signatures
   * and validating the transaction on chain work. This message will
   */
  private async _validateChannelAnnouncement(msg: ChannelAnnouncementMessage): Promise<boolean> {
    // attempt to find the existing chan_ann message
    const existing = await this._gossipStore.findChannelAnnouncement(msg.shortChannelId);

    // If the message is an extended message and it has populated the outpoint and capacity we
    // can skip message processing becuase there is nothing left to do.
    if (existing && existing instanceof ExtendedChannelAnnouncementMessage) {
      return;
    }

    // if there is an existing message and we don't have a chain_client then we want
    // to abort processing to prevent from populating the gossip store with chan_ann
    // messages that do not have a extended information. Alterntaively, if we DO have an
    // an existing message that is just a chan_ann and not ext_chan_ann and there is a
    // chain_client, we want to update the chan_ann with onchain information
    if (existing && !this._chainClient) {
      return;
    }

    // validate signatures for message
    if (!ChannelAnnouncementMessage.verifySignatures(msg)) {
      this.emit("error", new WireError(WireErrorCode.chanAnnSigFailed, [msg]));
      return;
    }

    if (this._chainClient) {
      // load the block hash for the block height
      const blockHash = await this._chainClient.getBlockHash(msg.shortChannelId.block);
      if (!blockHash) {
        this.emit("error", new WireError(WireErrorCode.chanBadBlockHash, [msg]));
        return;
      }

      // load the block details so we can find the tx
      const block = await this._chainClient.getBlock(blockHash);
      if (!block) {
        this.emit("error", new WireError(WireErrorCode.chanBadBlock, [msg, blockHash]));
        return;
      }

      // load the txid from the block details
      const txId = block.tx[msg.shortChannelId.txIdx];
      if (!txId) {
        this.emit("error", new WireError(WireErrorCode.chanAnnBadTx, [msg]));
        return;
      }

      // obtain a UTXO to verify the tx hasn't been spent yet
      const utxo = await this._chainClient.getUtxo(txId, msg.shortChannelId.voutIdx);
      if (!utxo) {
        this.emit("error", new WireError(WireErrorCode.chanUtxoSpent, [msg]));
        return;
      }

      // verify the tx script is a p2ms
      const expectedScript = fundingScript([msg.bitcoinKey1, msg.bitcoinKey2]);
      const actualScript = Buffer.from(utxo.scriptPubKey.hex, "hex");
      if (!expectedScript.equals(actualScript)) {
        this.emit("error", new WireError(WireErrorCode.chanBadScript, [msg, expectedScript, actualScript])); // prettier-ignore
        return;
      }

      // construct outpoint
      const outpoint = new OutPoint(txId, msg.shortChannelId.voutIdx);

      // calculate capacity in satoshi
      // Not sure about this code. MAX_SAFE_INTEGER is still safe
      // for Bitcoin satoshi.
      const capacity = BigInt(Math.round(utxo.value * 10 ** 8));

      // overright msg with extended channel_announcement
      const extended = ExtendedChannelAnnouncementMessage.fromMessage(msg);
      extended.outpoint = outpoint;
      extended.capacity = capacity;
      msg = extended;
    }

    // save channel_ann
    await this._gossipStore.saveChannelAnnouncement(msg);

    // broadcast valid message
    this.emit("message", msg);

    // process outstanding node messages
    const pendingUpdates = [
      await this._pendingStore.findChannelUpdate(msg.shortChannelId, 0),
      await this._pendingStore.findChannelUpdate(msg.shortChannelId, 1),
    ];
    for (const pendingUpdate of pendingUpdates) {
      if (pendingUpdate) {
        await this._pendingStore.deleteChannelUpdate(
          pendingUpdate.shortChannelId,
          pendingUpdate.direction,
        );
        await this._validateChannelUpdate(pendingUpdate);
      }
    }

    // process outstanding node messages
    const pendingNodeAnns = [
      await this._pendingStore.findNodeAnnouncement(msg.nodeId1),
      await this._pendingStore.findNodeAnnouncement(msg.nodeId2),
    ];
    for (const pendingNodeAnn of pendingNodeAnns) {
      if (pendingNodeAnn) {
        await this._pendingStore.deleteNodeAnnouncement(pendingNodeAnn.nodeId);
        await this._validateNodeAnnouncement(pendingNodeAnn);
      }
    }
  }

  /**
   * Validates a channel_update message by ensuring that:
   * - the channel_announcement has already been recieved
   * - the channel_update is not old
   * - the channel_update is correctly signed by the node
   */
  private async _validateChannelUpdate(msg: ChannelUpdateMessage) {
    // Ensure a channel announcement exists. If it does not,
    // we need to queue the update message until the channel announcement
    // can be adequately processed. Technically according to the specification in
    // Bolt 07, we should ignore channel_update message if we not processed
    // a valid channel_announcement. In reality, we may end up in a situation
    // where a channel_update makes it to our peer prior to the channel_announcement
    // being received.
    const channelMessage = await this._gossipStore.findChannelAnnouncement(msg.shortChannelId);
    if (!channelMessage) {
      await this._pendingStore.saveChannelUpdate(msg);
      return;
    }

    // ignore out of date message
    const existingUpdate = await this._gossipStore.findChannelUpdate(
      msg.shortChannelId,
      msg.direction,
    );
    if (existingUpdate && existingUpdate.timestamp >= msg.timestamp) return;

    // validate message signature for the node in
    const nodeId = msg.direction === 0 ? channelMessage.nodeId1 : channelMessage.nodeId2;
    if (!ChannelUpdateMessage.validateSignature(msg, nodeId)) {
      this.emit("error", new WireError(WireErrorCode.chanUpdSigFailed, [msg, nodeId]));
      return;
    }

    // save the message
    await this._gossipStore.saveChannelUpdate(msg);

    // broadcast valid message
    this.emit("message", msg);
  }
}
