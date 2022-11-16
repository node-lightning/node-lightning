import { OutPoint } from "@node-lightning/bitcoin";
import { IWireMessage } from "../messages/IWireMessage";
import { MessageType } from "../MessageType";
import { ChannelAnnouncementMessage } from "../messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "../messages/ChannelUpdateMessage";
import { NodeAnnouncementMessage } from "../messages/NodeAnnouncementMessage";
import { EventEmitter } from "events";
import { Channel } from "./channel";
import { ChannelSettings } from "./channel-settings";
import { channelFromMessage } from "./deserialize/channel-from-message";
import { channelSettingsFromMessage } from "./deserialize/channel-settings-from-message";
import { Graph } from "./graph";
import { ChannelNotFoundError } from "./graph-error";
import { GraphError } from "./graph-error";
import { Node } from "./node";

// tslint:disable-next-line: interface-name
export declare interface GraphManager {
    on(event: "node", fn: (node: Node) => void): this;
    on(event: "channel", fn: (channel: Channel) => void): this;
    on(event: "channel_update", fn: (channel: Channel, settings: ChannelSettings) => void): this;
    on(event: "error", fn: (err: GraphError) => void): this;
}

/**
 * GraphManager is a facade around a Graph object. It converts in-bound
 * gossip messages from the wire into a graph representation. Channels
 * can also be removed by monitoring the block chain via a chainmon object.
 */
export class GraphManager extends EventEmitter {
    public graph: Graph;

    constructor(graph = new Graph()) {
        super();
        this.graph = graph;
    }

    /**
     * Closes channel via the outpoint
     * @param outpoint
     */
    public removeChannel(outpoint: OutPoint) {
        const outpointStr = outpoint.toString();
        for (const channel of this.graph.channels.values()) {
            if (outpointStr === channel?.channelPoint?.toString()) {
                this.graph.removeChannel(channel);
                this.emit("channel_closed", channel);
                return;
            }
        }
    }

    public onWireMessage(msg: IWireMessage) {
        // channel_announcement messages are processed by:
        // First ensuring that we don't already have a duplicate channel.
        // We then check to see if we need to insert node
        // references. Inserting temporary node's is required because we
        // may receive a channel_announcement without ever receiving
        // node_announcement messages.

        if (isChannelAnnouncment(msg)) {
            const channel = channelFromMessage(msg);

            // abort processing if the channel already exists
            if (this.graph.getChannel(msg.shortChannelId)) {
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
        if (isChannelUpdate(msg)) {
            // first validate we have a channel
            const channel = this.graph.getChannel(msg.shortChannelId);
            if (!channel) {
                this.emit("error", new ChannelNotFoundError(msg.shortChannelId));
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
        if (isNodeAnnouncement(msg)) {
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

function isChannelAnnouncment(msg: IWireMessage): msg is ChannelAnnouncementMessage {
    return msg.type === MessageType.ChannelAnnouncement;
}

function isChannelUpdate(msg: IWireMessage): msg is ChannelUpdateMessage {
    return msg.type === MessageType.ChannelUpdate;
}

function isNodeAnnouncement(msg: IWireMessage): msg is NodeAnnouncementMessage {
    return msg.type === MessageType.NodeAnnouncement;
}
