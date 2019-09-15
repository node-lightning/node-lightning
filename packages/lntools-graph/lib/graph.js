// @ts-check

/**
 * @typedef {import("./channel").Channel} Channel
 * @typedef {import("./node").Node} Node
 * @typedef {import("./outpoint").OutPoint} OutPoint
 * @typedef {import("./channel-settings").ChannelSettings} ChannelSettings
 */

exports.Graph = class Graph {
  /**
   * Graph maintains the current peer-to-peer graph state. It is an
   * EventEmitter that emits changes to the graph state.

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
  constructor() {
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
     * The height the graph has been synced through
     * @type {number}
     */
    this.syncHeight = 0;
  }

  /**
   * Adds a node to the graph
   * @param {Node} node
   */
  addNode(node) {
    this.nodes.set(node.nodeId.toString('hex'), node);
  }

  /**
   * Adds a channgel to the graph
   * @param {Channel} channel
   */
  addChannel(channel) {
    let node1 = this.getNode(channel.nodeId1);
    let node2 = this.getNode(channel.nodeId2);
    if (!node1 || !node2) throw new Error('Channel node does not exist');

    // attach channel
    let key = channel.shortChannelId.toString();
    this.channels.set(key, channel);

    // attach channel to node 1
    node1.linkChannel(channel);

    // attach channel to node 2
    node2.linkChannel(channel);
  }

  /**
   * Gets a node in the graph
   * @param {Buffer} nodeId
   * @returns {Node}
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId.toString('hex'));
  }

  /**
   * Gets a node in the channel by shortChannelId
   * @param {*} shortChannelId
   */
  getChannel(shortChannelId) {
    return this.channels.get(shortChannelId.toString());
  }

  /**
   * Removes the node from the graph
   * @param {Channel} channel
   */
  removeChannel(channel) {
    let key = channel.shortChannelId.toString();
    let n1 = this.getNode(channel.nodeId1);
    let n2 = this.getNode(channel.nodeId2);

    // remove from channels list
    this.channels.delete(key);

    // detach from node 1
    n1.unlinkChannel(channel);

    // detach from node 2
    n2.unlinkChannel(channel);
  }

  /**
   * Performs a linear search of channels by lookup against
   * the chanPoint. Returns the channel if found, otherwise
   * returns undefined.
   * @param {OutPoint} chanPoint
   * @returns {Channel}
   */
  findChanByChanPoint(chanPoint) {
    for (let chan of this.channels.values()) {
      if (
        chan.channelPoint.txId === chanPoint.txId &&
        chan.channelPoint.voutIdx === chanPoint.voutIdx
      ) {
        return chan;
      }
    }
  }

  /**
   * Returns true if a node has a channel in the graph
   * @param {Buffer} nodeId
   * @returns {boolean}
   */
  hasChannel(nodeId) {
    for (let c of this.channels.values()) {
      if (c.nodeId1.equals(nodeId) || c.nodeId2.equals(nodeId)) return true;
    }
    return false;
  }

  toJSON() {
    let channels = Array.from(this.channels.values());
    let nodes = Array.from(this.nodes.values());
    return {
      syncHeight: this.syncHeight,
      channels: channels.map(c => c.toJSON()),
      nodes: nodes.map(n => n.toJSON()),
    };
  }
};
