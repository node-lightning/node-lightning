import { IGossipEmitter, IWireMessage } from "@lntools/wire";
import { ChannelAnnouncementMessage } from "@lntools/wire";
import { ChannelUpdateMessage } from "@lntools/wire";
import { NodeAnnouncementMessage } from "@lntools/wire";
import { EventEmitter } from "events";
import { channelFromMessage } from "./deserialize/channel-from-message";
import { channelSettingsFromMessage } from "./deserialize/channel-settings-from-message";
import { Graph } from "./graph";
import { ErrorCode, GraphError } from "./graph-error";
import { Node } from "./node";

/**
 * GraphManager is a facade around a Graph object. It converts in-bound
 * gossip messages from the wire into a graph representation. Channels
 * can also be removed by monitoring the block chain via a chainmon object.
 */
export class GraphManager extends EventEmitter {
  public graph: Graph;
  public gossipEmitter: IGossipEmitter;

  constructor(gossipManager: IGossipEmitter) {
    super();
    this.graph = new Graph();
    this.gossipEmitter = gossipManager;
    this.gossipEmitter.on("message", this._onMessage.bind(this));
  }

  private _onMessage(msg: IWireMessage) {
    // channel_announcement messages are processed by:
    // First ensuring that we don't already have a duplicate channel.
    // We then check to see if we need to insert node
    // references. Inserting temporary node's is required because we
    // may receieve a channel_announcement without ever receiving
    // node_announcement messages.

    if (msg instanceof ChannelAnnouncementMessage) {
      const channel = channelFromMessage(msg);

      // abort processing if the channel already exists
      if (this.graph.getChannel(msg.shortChannelId)) {
        this.emit("error", new GraphError(ErrorCode.duplicateChannel));
        return;
      }

      // construct node1 if required
      if (!this.graph.getNode(msg.nodeId1)) {
        const node1 = new Node();
        node1.nodeId = msg.nodeId1;
        this.graph.addNode(node1);
        this.emit("node", node1);
      }

      // construct node2 if required
      if (!this.graph.getNode(msg.nodeId2)) {
        const node2 = new Node();
        node2.nodeId = msg.nodeId2;
        this.graph.addNode(node2);
        this.emit("node", node2);
      }

      // finally attach the channel
      this.graph.addChannel(channel);
      this.emit("channel", channel);
      return;
    }

    // channel_update messages are processed by:
    // * looking for the existing channel, if it doesn't then an error is thrown.
    // * updating the existing channel
    // The GossipFilter in Wire should ensure that channel_announcement messages
    // are always transmitted prior to channel_update messages being announced.
    if (msg instanceof ChannelUpdateMessage) {
      // first validate we have a channel
      const channel = this.graph.getChannel(msg.shortChannelId);
      if (!channel) {
        this.emit("error", new GraphError(ErrorCode.channelNotFound));
        return;
      }

      // construct the settings and update the channel
      const settings = channelSettingsFromMessage(msg);
      channel.updateSettings(settings);
      this.emit("channel_update", channel, settings);
      return;
    }

    // node_announcement messages are processed by:
    // * finding or creating the node (if it doesn't exist)
    // * updating the node with values from the announcement
    if (msg instanceof NodeAnnouncementMessage) {
      let node = this.graph.getNode(msg.nodeId);
      if (!node) {
        node = new Node();
        node.nodeId = msg.nodeId;
        this.graph.addNode(node);
      }
      node.features = msg.features;
      node.lastUpdate = msg.timestamp;
      node.alias = msg.alias;
      node.rgbColor = msg.rgbColor;
      node.addresses = msg.addresses;
      this.emit("node", node);
    }
  }
}
