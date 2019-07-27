// @ts-check

const { AsyncProcessor } = require('./async-processor');

/**
 * @typedef {import("./graph").Graph} Graph
 * @typedef {import("@lntools/wire").ChannelAnnouncementMessage} ChannelAnnouncementMessage
 * @typedef {import("@lntools/wire").ChannelUpdateMessage} ChannelUpdateMessage
 * @typedef {import("@lntools/wire").NodeAnnouncementMessage} NodeAnnouncementMessage
 */

class GraphManager {
  /**
   * GraphManager is an external interface for queuing graph updates to prevent out
   * of control async updates from firing in parallel. This code is externalized
   * from the Graph object to allow for easier testabililty of the Graph
   *
   * @param {Graph} graph
   */
  constructor(graph) {
    this.graph = graph;
    this.enqueue = this.enqueue.bind(this);
    this._processUpdate = this._processUpdate.bind(this);
    this._processor = new AsyncProcessor(this._processUpdate);
  }

  /**
   * Enqueues a message for processing
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
    return this.graph.pendingUpdates;
  }

  async _processUpdate(msg) {
    let graph = this.graph;
    switch (msg.type) {
      case 256:
        await graph.processChannelAnnouncement(/** @type {ChannelAnnouncementMessage} */ (msg));
        break;
      case 257:
        await graph.processNodeAnnouncement(/** @type {NodeAnnouncementMessage} */ (msg));
        break;
      case 258:
        await graph.processChannelUpdate(/** @type {ChannelUpdateMessage} */ (msg));
        break;
    }
  }
}

exports.GraphManager = GraphManager;
