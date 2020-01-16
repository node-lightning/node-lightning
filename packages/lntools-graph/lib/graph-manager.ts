import { BitcoindClient } from "@lntools/bitcoind";
import { ChannelAnnouncementMessage } from "@lntools/wire";
import { NodeAnnouncementMessage } from "@lntools/wire";
import { ChannelUpdateMessage } from "@lntools/wire";
import BN from "bn.js";
import { EventEmitter } from "events";
import { AsyncProcessor } from "./async-processor";
import { Channel } from "./channel";
import { ChannelSettings } from "./channel-settings";
import { channelFromMessage } from "./deserialize/channel-from-message";
import { channelSettingsFromMessage } from "./deserialize/channel-settings-from-message";
import { ErrorCode } from "./error-code";
import { Graph } from "./graph";
import { GraphError } from "./graph-error";
import { Node } from "./node";
import { OutPoint } from "./outpoint";
import { fundingScript } from "./tx";

export class GraphManager extends EventEmitter {
  public graph: Graph;
  public chainClient: BitcoindClient;
  public syncHeight: number = 0;

  private _processor: AsyncProcessor;

  /**
   * Pending nodes
   */
  private _pendingNodeAnnouncements: Map<string, NodeAnnouncementMessage>;

  /**
   * Pending channel updates
   */
  private _pendingChannelUpdates: Map<string, ChannelUpdateMessage[]>;

  /**
   * GraphManager is an external interface for queuing graph updates to prevent out
   * of control async updates from firing in parallel. This code is externalized
   * from the Graph object to allow for easier testabililty of the Graph
   *
   * @param {Graph} graph
   * @param {BitcoindClient} chainClient
   */
  constructor(graph, chainClient) {
    super();
    this.graph = graph;
    this.chainClient = chainClient;

    this.enqueue = this.enqueue.bind(this);
    this._processUpdate = this._processUpdate.bind(this);
    this._processor = new AsyncProcessor(this._processUpdate);
    this._pendingNodeAnnouncements = new Map();
    this._pendingChannelUpdates = new Map();
  }

  /**
   * Enqueues a raw message for processing
   */
  public enqueue(msg: ChannelAnnouncementMessage | NodeAnnouncementMessage | ChannelUpdateMessage) {
    // ignore messages that do not contain p2p graph data
    if (msg.type !== 256 && msg.type !== 257 && msg.type !== 258) {
      return;
    }

    // defer processing until there is capacity
    this._processor.enqueue(msg);
  }

  /**
   * Returns the number of queued messages waiting to be processed
   */
  get queued(): number {
    return this._processor.size;
  }

  /**
   * Returns the number of pending updates the graph has queued
   */
  get pending(): number {
    return this._pendingChannelUpdates.size + this._pendingNodeAnnouncements.size;
  }

  /**
   * Process a node announcement message according to BOLT #7 rules
   */
  public async processNodeAnnouncement(msg: NodeAnnouncementMessage) {
    // get or construct a node
    const node = this.graph.getNode(msg.nodeId) || new Node();

    // check if the message is newer than the last update
    if (node.lastUpdate && msg.timestamp < node.lastUpdate) return;

    // queue node if we don't have any channels
    if (!this.graph.hasChannel(msg.nodeId)) {
      this._queueNodeAnnouncment(msg);
      return;
    }

    // validate message signature
    if (!NodeAnnouncementMessage.verifySignatures(msg)) {
      this.emit("error", new GraphError(ErrorCode.nodeAnnSigFailed, [msg]));
      return;
    }

    // update the node's information
    node.nodeSignature = msg.signature;
    node.nodeId = msg.nodeId;
    node.features = msg.features;
    node.lastUpdate = msg.timestamp;
    node.alias = msg.alias;
    node.rgbColor = msg.rgbColor;
    node.addresses = msg.addresses;

    // update the node reference
    this.graph.addNode(node);

    // emit node update event
    this.emit("node", node);
  }

  /**
   * Processes a ChannelAnnouncementMessage by verifying the signatures
   * and validating the transaction on chain work. This message will
   */
  public async processChannelAnnouncement(msg: ChannelAnnouncementMessage) {
    // abort if we've already processed this channel before...
    if (this.graph.getChannel(msg.shortChannelId)) return;

    // validate signatures for message
    if (!ChannelAnnouncementMessage.verifySignatures(msg)) {
      this.emit("error", new GraphError(ErrorCode.chanAnnSigFailed, [msg]));
      return false;
    }

    // load the block hash for the block height
    const blockHash = await this.chainClient.getBlockHash(msg.shortChannelId.block);
    if (!blockHash) {
      this.emit("error", new GraphError(ErrorCode.chanBadBlockHash, [msg]));
      return;
    }

    // load the block details so we can find the tx
    const block = await this.chainClient.getBlock(blockHash);
    if (!block) {
      this.emit("error", new GraphError(ErrorCode.chanBadBlock, [msg, blockHash]));
      return;
    }

    // load the txid from the block details
    const txId = block.tx[msg.shortChannelId.txIdx];
    if (!txId) {
      this.emit("error", new GraphError(ErrorCode.chanAnnBadTx, [msg]));
      return;
    }

    // obtain a UTXO to verify the tx hasn't been spent yet
    const utxo = await this.chainClient.getUtxo(txId, msg.shortChannelId.voutIdx);
    if (!utxo) {
      this.emit("error", new GraphError(ErrorCode.chanUtxoSpent, [msg]));
      return false;
    }

    // verify the tx script is a p2ms
    const expectedScript = fundingScript([msg.bitcoinKey1, msg.bitcoinKey2]);
    const actualScript = Buffer.from(utxo.scriptPubKey.hex, "hex");
    if (!expectedScript.equals(actualScript)) {
      this.emit("error", new GraphError(ErrorCode.chanBadScript, [msg, expectedScript, actualScript])); // prettier-ignore
      return;
    }

    // update sync height of the graph
    if (this.syncHeight < block.height) {
      this.syncHeight = block.height;
    }

    // construct new channel message
    const channel = channelFromMessage(msg);
    channel.channelPoint = new OutPoint(txId, msg.shortChannelId.voutIdx);
    channel.capacity = new BN(utxo.value * 10 ** 8);

    // add node1 if necessary
    if (!this.graph.getNode(msg.nodeId1)) {
      const node = new Node();
      node.nodeId = msg.nodeId1;
      this.graph.addNode(node);
      this.emit("node", node);
    }

    // add node2 if necessary
    if (!this.graph.getNode(msg.nodeId2)) {
      const node = new Node();
      node.nodeId = msg.nodeId2;
      this.graph.addNode(node);
      this.emit("node", node);
    }

    // save the channel
    this.graph.addChannel(channel);

    // process outstanding node messages
    await this._applyPendingNodeAnnouncements(channel.nodeId1);
    await this._applyPendingNodeAnnouncements(channel.nodeId2);

    // process outstanding update messages
    await this._applyPendingChannelUpdates(msg.shortChannelId.toString());
  }

  /**
   * Updates the channel settings for a specific node
   * in the channel announcment
   */
  public async processChannelUpdate(msg: ChannelUpdateMessage) {
    const key = msg.shortChannelId.toString();

    // get the channel
    const channel = this.graph.channels.get(key);

    // if this doesn't exist we need to enqueue it for processing and
    // validation later
    if (!channel) {
      this._queueChanneldUpdate(key, msg);
      return;
    }

    // validate message
    const nodeId = msg.direction === 0 ? channel.nodeId1 : channel.nodeId2;
    if (!ChannelUpdateMessage.validateSignature(msg, nodeId)) {
      this.emit("error", new GraphError(ErrorCode.chanUpdSigFailed, [msg, nodeId]));
      return;
    }

    // construct settings from the message
    const settings = channelSettingsFromMessage(msg);

    // update the channel settings
    channel.updateSettings(settings);

    // update the channel
    this.graph.channels.set(key, channel);

    // emit channel updated
    this.emit("channel", channel);
  }

  /**
   * Closes the channel based on the activity of a channel point
   * and emits a channel_close event
   */
  public async closeChannel(chanPoint: OutPoint) {
    // find channel
    const channel = this.graph.findChanByChanPoint(chanPoint);

    // remove the channel from the graph and nodes
    this.graph.removeChannel(channel);

    // this emit channel close
    this.emit("channel_close", { channel });
  }

  /**
   * Process any update message
   */
  private async _processUpdate(
    msg: ChannelAnnouncementMessage | ChannelUpdateMessage | NodeAnnouncementMessage,
  ) {
    switch (msg.type) {
      case 256:
        await this.processChannelAnnouncement(msg as ChannelAnnouncementMessage);
        break;
      case 257:
        await this.processNodeAnnouncement(msg as NodeAnnouncementMessage);
        break;
      case 258:
        await this.processChannelUpdate(msg as ChannelUpdateMessage);
        break;
    }
  }

  /**
   * We will store a single NodeAnnouncmentMessage for later replay
   * if there is a valid ChannelAnnouncementMessage.
   *
   * @remarks
   * The spec specifically points out that this creates an attack
   * vector. We should leverage a FIFO cache to limit the attack
   * space.
   */
  private _queueNodeAnnouncment(msg: NodeAnnouncementMessage) {
    const key = msg.nodeId.toString("hex");
    const existing = this._pendingNodeAnnouncements.get(key);
    if (!existing || existing.timestamp < msg.timestamp) {
      this._pendingNodeAnnouncements.set(key, msg);
    }
  }

  private _queueChanneldUpdate(id: string, msg: ChannelUpdateMessage) {
    const msgs = this._pendingChannelUpdates.get(id) || [];
    msgs.push(msg);
    this._pendingChannelUpdates.set(id, msgs);
  }

  private async _applyPendingChannelUpdates(id: string) {
    const msgs = this._pendingChannelUpdates.get(id);
    if (!msgs) return;
    for (const msg of msgs) {
      await this.processChannelUpdate(msg);
    }
    this._pendingChannelUpdates.delete(id);
  }

  private async _applyPendingNodeAnnouncements(nodeId: Buffer) {
    const key = nodeId.toString("hex");
    const msg = this._pendingNodeAnnouncements.get(key);
    if (msg) {
      await this.processNodeAnnouncement(msg);
      this._pendingNodeAnnouncements.delete(key);
    }
  }
}

exports.GraphManager = GraphManager;
