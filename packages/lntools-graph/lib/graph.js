// @ts-check
const { EventEmitter } = require('events');
const { Channel } = require('./channel');
const { ChannelSettings } = require('./channel-settings');
const { Node } = require('./node');
const { ChannelAnnouncementMessage } = require('@lntools/wire');
const { NodeAnnouncementMessage } = require('@lntools/wire');
const { ChannelUpdateMessage } = require('@lntools/wire');
const { shortChannelIdObj } = require('@lntools/wire');
const BN = require('bn.js');
const { fundingScript } = require('./tx');
const { GraphError } = require('./graph-error');
const { ErrorCodes } = require('./graph-error');

/**
  Construct a unique Id from the chainHash and shortChannelID
  @param {object} param
  @param {Buffer} param.chainHash
  @param {Buffer} param.shortChannelId
  @return {string}
 */
function uniqueChannelId({ chainHash, shortChannelId }) {
  return chainHash.slice(0, 4).toString('hex') + '_' + shortChannelId.toString('hex');
}

exports.Graph = class Graph extends EventEmitter {
  /**
   * Graph maintains the current peer-to-peer graph state. It is an
   * EventEmitter that emits changes to the graph state.

    @param {import("@lntools/bitcoind").BitcoindClient} chainClient

    @remarks
    Validating:

    channel_announcement
      * validate chainhash is for Bitcoin
      * validate funding tx output defined in the is P2WSH that pays
        to bitcoin_node_1/2
      * validate bitcoin_node_1/2 signed message
      * validate node_id_1/2 signed message

    channel_update
      * validate channel_announcment has been received, otherwise discard message
      * verify the channel has not closed, if so discard message
      * at least one side has to send a channel_update message before the channel
        is ready to be routed through

    node_announcement
      * validate signature


    This could operate in two modes:

    Headless Mode - a 1-way construction with where peer
      messages are received and signature validation occurs
      but we do not perform any on-chain validation.

      The major downside to technique would be that we cannot
      observe or watch for channel close events which will give
      an artificial view of the network graph.

      In theory we could set this as a mode where we just
      reconstruct the graph by fetching a full graph dump
      from remote nodes.

    Full Mode - the graph is validated by performing signature
      checks as well as blockchain validations. This mode
      will add hooks to remove channels when those close via
      some blockchain watching service.

   */
  constructor(chainClient) {
    super();

    /**
      @type {import("@lntools/bitcoind").BitcoindClient}
     */
    this.chainClient = chainClient;

    /**
      Map containing all nodes in the system
      @type {Map<string, import('./node').Node>}
     */
    this.nodes = new Map();

    /**
      Map containing all channels in system
      @type {Map<string, import("./channel").Channel>}
     */
    this.channels = new Map();

    /**
      List of pending nodes.

      @type {Map<string, import('@lntools/wire').NodeAnnouncementMessage>}
     */
    this._pendingNodeAnnouncements = new Map();

    /**
      List of pending channeld updates

      @type {Map<string, Array<import('@lntools/wire').ChannelUpdateMessage>>}
     */
    this._pendingChannelUpdates = new Map();
  }

  /**
    Process a node announcement message according to BOLT #7 rules

    @param {NodeAnnouncementMessage} msg
   */
  async processNodeAnnouncement(msg) {
    // get or construct a node
    let node = this.nodes.get(msg.nodeId.toString('hex')) || new Node();

    // check if the message is newer than the last update
    if (node.lastUpdate && msg.timestamp < node.lastUpdate) return;

    // queue node if we don't have any channels
    if (!this._hasChannel(msg.nodeId)) {
      this._queueNodeAnnouncment(msg);
      return;
    }

    // validate message signature
    if (!NodeAnnouncementMessage.verifySignatures(msg)) {
      this.emit('error', new GraphError(ErrorCodes.nodeAnnSigFailed, [msg]));
      return;
    }

    // update the node's information
    node._nodeAnnouncementMessage = msg;
    node.lastUpdate = msg.timestamp;
    node.nodeId = msg.nodeId;
    node.alias = msg.alias;
    node.rgbColor = msg.rgbColor;
    node.addresses = msg.addresses;

    // update the node reference
    this.nodes.set(node.nodeId.toString('hex'), node);

    // emit node update event
    this.emit('node', node);
  }

  /**
    Processes a ChannelAnnouncementMessage by verifying the signatures
    and validating the transaction on chain work. This message will

    @param {ChannelAnnouncementMessage } msg
   */
  async processChannelAnnouncement(msg) {
    let id = uniqueChannelId(msg);

    // either get the existing channel or create a new one
    let channel = this.channels.get(id) || new Channel();

    // check if an announcement message has already been attached
    if (channel._channelAnnouncmentMessage) return;

    // validate signatures for message
    if (!ChannelAnnouncementMessage.verifySignatures(msg)) {
      this.emit('error', new GraphError(ErrorCodes.chanAnnSigFailed, [msg]));
      return false;
    }

    // attach shortChannelId
    channel.shortChannelId = msg.shortChannelId;

    // validate UTXO for message
    let shortChannelID = shortChannelIdObj(msg.shortChannelId);

    // load the block hash for the block height
    let blockHash = await this.chainClient.getBlockHash(shortChannelID.block);
    if (!blockHash) {
      this.emit('error', new GraphError(ErrorCodes.chanBadBlockHash, [msg, shortChannelID]));
      return;
    }

    // load the block details so we can find the tx
    let block = await this.chainClient.getBlock(blockHash);
    if (!block) {
      this.emit('error', new GraphError(ErrorCodes.chanBadBlock, [msg, shortChannelID, blockHash]));
      return;
    }

    // load the txid from the block details
    let txId = block.tx[shortChannelID.txIdx];
    if (!txId) {
      this.emit('error', new GraphError(ErrorCodes.chanAnnBadTx, [msg, shortChannelID]));
      return;
    }

    // obtain a UTXO to verify the tx hasn't been spent yet
    let utxo = await this.chainClient.getUtxo(txId, shortChannelID.voutIdx);
    if (!utxo) {
      this.emit('error', new GraphError(ErrorCodes.chanUtxoSpent, [msg, shortChannelID]));
      return false;
    }

    // verify the tx script is a p2ms
    let expectedScript = fundingScript([msg.bitcoinKey1, msg.bitcoinKey2]);
    let actualScript = Buffer.from(utxo.scriptPubKey.hex, 'hex');
    if (!expectedScript.equals(actualScript)) {
      this.emit('error',new GraphError(ErrorCodes.chanBadScript, [msg, expectedScript, actualScript])); // prettier-ignore
      return;
    }

    // attach properties
    channel._channelAnnouncmentMessage = msg;
    channel.chainHash = msg.chainHash;
    channel.channelPoint = { txId, output: shortChannelID.voutIdx };
    channel.capacity = new BN(utxo.value * 10 ** 8);
    channel.nodeId1 = msg.nodeId1;
    channel.nodeId2 = msg.nodeId2;

    // save the channel
    this.channels.set(id, channel);

    // process outstanding node messages
    await this._applyPendingNodeAnnouncements(channel.nodeId1);
    await this._applyPendingNodeAnnouncements(channel.nodeId2);

    // add node1 if necessary
    if (!this.nodes.get(msg.nodeId1.toString('hex'))) {
      let node = new Node();
      node.nodeId = msg.nodeId1;
      this.nodes.set(node.nodeId.toString('hex'), node);
      this.emit('node', node);
    }

    // add node2 if necessary
    if (!this.nodes.get(msg.nodeId2.toString('hex'))) {
      let node = new Node();
      node.nodeId = msg.nodeId2;
      this.nodes.set(node.nodeId.toString('hex'), node);
      this.emit('node', node);
    }

    // attach channel to node 1
    let node1 = this.nodes.get(msg.nodeId1.toString('hex'));
    node1.linkChannel(channel);

    // attach channel to node 2
    let node2 = this.nodes.get(msg.nodeId2.toString('hex'));
    node2.linkChannel(channel);

    // process outstanding update messages
    await this._applyPendingChannelUpdates(id);
  }

  /**
    Updates the channel settings for a specific node
    in the channel announcment

    @param {ChannelUpdateMessage} msg
   */
  async processChannelUpdate(msg) {
    let id = uniqueChannelId(msg);

    // get the channel
    let channel = this.channels.get(id);

    // if this doesn't exist we need to enqueue it for processing and
    // validation later
    if (!channel) {
      this._queueChanneldUpdate(id, msg);
      return;
    }

    // validate message
    let nodeId = msg.direction === 0 ? channel.nodeId1 : channel.nodeId2;
    if (!ChannelUpdateMessage.validateSignature(msg, nodeId)) {
      this.emit('error', new GraphError(ErrorCodes.chanUpdSigFailed, [msg, nodeId]));
      return;
    }

    // construct settings from the message
    let settings = ChannelSettings.fromMsg(msg);

    // update the channel settings
    channel.updateSettings(settings);

    // update the channel
    this.channels.set(id, channel);

    // emit channel updated
    this.emit('channel', channel);
  }

  /**

    @param {Buffer} nodeId
    @returns {boolean}
   */
  _hasChannel(nodeId) {
    for (let c of this.channels.values()) {
      if (c.nodeId1.equals(nodeId) || c.nodeId2.equals(nodeId)) return true;
    }
    return false;
  }

  /**
    We will store a single NodeAnnouncmentMessage for later replay
    if there is a valid ChannelAnnouncementMessage.

    @remarks

    The spec specifically points out that this creates an attack
    vector. We should leverage a FIFO cache to limit the attack
    space.

    @param {import('@lntools/wire').NodeAnnouncementMessage} msg
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
};
