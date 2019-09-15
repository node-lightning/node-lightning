// @ts-check

const { AsyncProcessor } = require('./async-processor');
const { EventEmitter } = require('events');
const { Node } = require('./node');
const { OutPoint } = require('./outpoint');
const { ChannelAnnouncementMessage } = require('@lntools/wire');
const { NodeAnnouncementMessage } = require('@lntools/wire');
const { ChannelUpdateMessage } = require('@lntools/wire');
const BN = require('bn.js');
const { fundingScript } = require('./tx');
const { GraphError } = require('./graph-error');
const { ErrorCodes } = require('./graph-error');
const { channelFromMessage } = require('./deserialize/channel-from-message');
const { channelSettingsFromMessage } = require('./deserialize/channel-settings-from-message');

/**
 * @typedef {import("@lntools/bitcoind").BitcoindClient} BitcoindClient
 * @typedef {import("./graph").Graph} Graph
 * @typedef {import("./channel").Channel} Channel
 * @typedef {import("./channel-settings").ChannelSettings} ChannelSettings
 * @typedef {import("@lntools/wire").ChannelAnnouncementMessage} ChannelAnnouncementMessage
 * @typedef {import("@lntools/wire").ChannelUpdateMessage} ChannelUpdateMessage
 * @typedef {import("@lntools/wire").NodeAnnouncementMessage} NodeAnnouncementMessage
 */

class GraphManager extends EventEmitter {
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

    /**
     * List of pending nodes.
     *
     * @type {Map<string, NodeAnnouncementMessage>}
     */
    this._pendingNodeAnnouncements = new Map();

    /**
     * List of pending channeld updates
     *
     * @type {Map<string, Array<ChannelUpdateMessage>>}
     */
    this._pendingChannelUpdates = new Map();
  }

  /**
   * Enqueues a raw message for processing
   *
   * @param {ChannelAnnouncementMessage|NodeAnnouncementMessage|ChannelUpdateMessage} msg
   */
  enqueue(msg) {
    // ignore messages that do not contain p2p graph data
    if (msg.type !== 256 && msg.type !== 257 && msg.type !== 258) {
      return;
    }

    // defer processing until there is capacity
    this._processor.enqueue(msg);
  }

  /**
   * Returns the number of queued messages waiting to be processed
   * @type {number}
   */
  get queued() {
    return this._processor.size;
  }

  /**
   * Returns the number of pending updates the graph has queued
   * @type {number}
   */
  get pending() {
    return this._pendingChannelUpdates.size + this._pendingNodeAnnouncements.size;
  }

  /**
   *
   * @param {*} msg
   */
  async _processUpdate(msg) {
    switch (msg.type) {
      case 256:
        await this.processChannelAnnouncement(/** @type {ChannelAnnouncementMessage} */ (msg));
        break;
      case 257:
        await this.processNodeAnnouncement(/** @type {NodeAnnouncementMessage} */ (msg));
        break;
      case 258:
        await this.processChannelUpdate(/** @type {ChannelUpdateMessage} */ (msg));
        break;
    }
  }

  /**
   * Process a node announcement message according to BOLT #7 rules
   *
   * @param {NodeAnnouncementMessage} msg
   */
  async processNodeAnnouncement(msg) {
    // get or construct a node
    let node = this.graph.getNode(msg.nodeId) || new Node();

    // check if the message is newer than the last update
    if (node.lastUpdate && msg.timestamp < node.lastUpdate) return;

    // queue node if we don't have any channels
    if (!this.graph.hasChannel(msg.nodeId)) {
      this._queueNodeAnnouncment(msg);
      return;
    }

    // validate message signature
    if (!NodeAnnouncementMessage.verifySignatures(msg)) {
      this.emit('error', new GraphError(ErrorCodes.nodeAnnSigFailed, [msg]));
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
    this.emit('node', node);
  }

  /**
   * Processes a ChannelAnnouncementMessage by verifying the signatures
   * and validating the transaction on chain work. This message will
   *
   * @param {ChannelAnnouncementMessage } msg
   */
  async processChannelAnnouncement(msg) {
    // abort if we've already processed this channel before...
    if (this.graph.getChannel(msg.shortChannelId)) return;

    // validate signatures for message
    if (!ChannelAnnouncementMessage.verifySignatures(msg)) {
      this.emit('error', new GraphError(ErrorCodes.chanAnnSigFailed, [msg]));
      return false;
    }

    // load the block hash for the block height
    let blockHash = await this.chainClient.getBlockHash(msg.shortChannelId.block);
    if (!blockHash) {
      this.emit('error', new GraphError(ErrorCodes.chanBadBlockHash, [msg]));
      return;
    }

    // load the block details so we can find the tx
    let block = await this.chainClient.getBlock(blockHash);
    if (!block) {
      this.emit('error', new GraphError(ErrorCodes.chanBadBlock, [msg, blockHash]));
      return;
    }

    // load the txid from the block details
    let txId = block.tx[msg.shortChannelId.txIdx];
    if (!txId) {
      this.emit('error', new GraphError(ErrorCodes.chanAnnBadTx, [msg]));
      return;
    }

    // obtain a UTXO to verify the tx hasn't been spent yet
    let utxo = await this.chainClient.getUtxo(txId, msg.shortChannelId.voutIdx);
    if (!utxo) {
      this.emit('error', new GraphError(ErrorCodes.chanUtxoSpent, [msg]));
      return false;
    }

    // verify the tx script is a p2ms
    let expectedScript = fundingScript([msg.bitcoinKey1, msg.bitcoinKey2]);
    let actualScript = Buffer.from(utxo.scriptPubKey.hex, 'hex');
    if (!expectedScript.equals(actualScript)) {
      this.emit('error',new GraphError(ErrorCodes.chanBadScript, [msg, expectedScript, actualScript])); // prettier-ignore
      return;
    }

    // update sync height of the graph
    if (this.syncHeight < block.height) {
      this.syncHeight = block.height;
    }

    // construct new channel message
    let channel = channelFromMessage(msg);
    channel.channelPoint = new OutPoint(txId, msg.shortChannelId.voutIdx);
    channel.capacity = new BN(utxo.value * 10 ** 8);

    // add node1 if necessary
    if (!this.graph.getNode(msg.nodeId1)) {
      let node = new Node();
      node.nodeId = msg.nodeId1;
      this.graph.addNode(node);
      this.emit('node', node);
    }

    // add node2 if necessary
    if (!this.graph.getNode(msg.nodeId2)) {
      let node = new Node();
      node.nodeId = msg.nodeId2;
      this.graph.addNode(node);
      this.emit('node', node);
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
   *
   * @param {ChannelUpdateMessage} msg
   */
  async processChannelUpdate(msg) {
    let key = msg.shortChannelId.toString();

    // get the channel
    let channel = this.graph.channels.get(key);

    // if this doesn't exist we need to enqueue it for processing and
    // validation later
    if (!channel) {
      this._queueChanneldUpdate(key, msg);
      return;
    }

    // validate message
    let nodeId = msg.direction === 0 ? channel.nodeId1 : channel.nodeId2;
    if (!ChannelUpdateMessage.validateSignature(msg, nodeId)) {
      this.emit('error', new GraphError(ErrorCodes.chanUpdSigFailed, [msg, nodeId]));
      return;
    }

    // construct settings from the message
    let settings = channelSettingsFromMessage(msg);

    // update the channel settings
    channel.updateSettings(settings);

    // update the channel
    this.graph.channels.set(key, channel);

    // emit channel updated
    this.emit('channel', channel);
  }

  /**
   * Closes the channel based on the activity of a channel point
   * and emits a channel_close event
   * @param {OutPoint} chanPoint
   */
  async closeChannel(chanPoint) {
    // find channel
    let channel = this.graph.findChanByChanPoint(chanPoint);

    // remove the channel from the graph and nodes
    this.graph.removeChannel(channel);

    // this emit channel close
    this.emit('channel_close', { channel });
  }

  /**
   * We will store a single NodeAnnouncmentMessage for later replay
   * if there is a valid ChannelAnnouncementMessage.
   *
   * @remarks
   * The spec specifically points out that this creates an attack
   * vector. We should leverage a FIFO cache to limit the attack
   * space.
   *
   * @param {NodeAnnouncementMessage} msg
   */
  _queueNodeAnnouncment(msg) {
    let key = msg.nodeId.toString('hex');
    let existing = this._pendingNodeAnnouncements.get(key);
    if (!existing || existing.timestamp < msg.timestamp) {
      this._pendingNodeAnnouncements.set(key, msg);
    }
  }

  /**

    @param {string} id
    @param {import('@lntools/wire').ChannelUpdateMessage} msg
   */
  _queueChanneldUpdate(id, msg) {
    let msgs = this._pendingChannelUpdates.get(id) || [];
    msgs.push(msg);
    this._pendingChannelUpdates.set(id, msgs);
  }

  /**
    @param {string} id
   */
  async _applyPendingChannelUpdates(id) {
    let msgs = this._pendingChannelUpdates.get(id);
    if (!msgs) return;
    for (let msg of msgs) {
      await this.processChannelUpdate(msg);
    }
    this._pendingChannelUpdates.delete(id);
  }

  /**
    @param {Buffer} nodeId
   */
  async _applyPendingNodeAnnouncements(nodeId) {
    let key = nodeId.toString('hex');
    let msg = this._pendingNodeAnnouncements.get(key);
    if (msg) {
      await this.processNodeAnnouncement(msg);
      this._pendingNodeAnnouncements.delete(key);
    }
  }
}

exports.GraphManager = GraphManager;
