// @ts-check
const Channel = require('./channel');
const Node = require('./node');

class GraphBuilder {
  /**
    chan_ann > chan_upd > node_ann

    Cache updates, preferably in an LRU cache and complete graph
    edges/nodes as messages cascade through requirements.

    @remarks

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
      @type {Map<string, import('./node')>}
     */
    this.nodes = new Map();
    this.channels = new Map();
    this.updateQueue = [];
  }

  addNode(ann) {
    let nodeId = ann.nodeId.toString('hex');

    let node = new Node();
    node.nodeId = nodeId;
    node.updates.push(ann);
    // rest of stuff goes here...

    this.nodes.set(nodeId, node);

    // need to find and process updates related to the node
    let relevent = this.updateQueue.filter(p => p.type === 'node' && p.id === nodeId);

    // iterate
    for (let p of relevent) {
      // remove from queue
      let idx = this.updateQueue.indexOf(p);
      this.updateQueue.splice(idx, 1);

      // reprocess
      this.updateChannel(p.update);
    }
  }

  addChannel(ann) {
    let channel = new Channel();
    channel.nodeId1 = ann.nodeId1.toString('hex');
    channel.nodeId2 = ann.nodeId2.toString('hex');
    channel.shortChannelId = ann.shortChannelIdAsNumberString();
    channel.updates.push(ann);
    this.channels.set(channel.shortChannelId, channel);
  }

  updateChannel(update) {
    let channelId = update.shortChannelIdAsNumberString();
    let channel = this.channels.get(channelId);

    if (!channel) {
      this.updateQueue.push({ type: 'channel', id: channelId, update });
      return;
    }

    let nodeIdBuf = update.direction === 0 ? channel.nodeId1 : channel.nodeId2;
    let nodeId = nodeIdBuf.toString('hex');

    let node = this.nodes.get(nodeId);
    if (!node) {
      this.updateQueue.push({ type: 'node', id: nodeId, update });
    }

    let settings;
    if (nodeId === channel.nodeId1) {
      settings = channel.node1Settings;
      if (!settings) {
        settings = channel.node1Settings = {};
      }
    } else if (nodeId === channel.nodeId2) {
      settings = channel.node2Settings;
      if (!settings) {
        settings = channel.node2Settings = {};
      }
    } else throw new Error(`unkonwn nodeid ${nodeId} ${channelId}`);

    // if (settings.timestamp !== undefined && settings.timestamp > update.timestamp) {
    //   console.warn('attempting to update with older message');
    //   return;
    // }

    channel.updates.push(update);

    // node specific settings
    settings.timestamp = update.timestamp;
    settings.cltvExpiryDelta = update.cltvExpiryDelta;
    settings.htlcMinimumMsat = update.htlcMinimumMsat.toString(10);
    settings.feeBaseMSat = update.feeBaseMsat.toString();
    settings.feeProportionalMillionths = update.feeProportionalMillionths.toString();
    settings.htlmMaximumMsat = update.htlmMaximumMsat
      ? update.htlmMaximumMsat.toString(10)
      : undefined;
    settings.disabled = update.disabled;
  }
}

module.exports = GraphBuilder;
