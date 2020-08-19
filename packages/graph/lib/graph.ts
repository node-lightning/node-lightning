import { ShortChannelId } from "@node-lightning/wire";
import { OutPoint } from "@node-lightning/wire";
import { Channel } from "./channel";
import { NodeNotFoundError } from "./graph-error";
import { Node } from "./node";

/**
 * Graph represents a
 */
export class Graph {
    /**
     * Map containing all nodes in the system
     */
    public nodes: Map<string, Node> = new Map();

    /**
     * Map containing all channels in the graph
     */
    public channels: Map<bigint, Channel> = new Map();

    /**
     * The height the graph has been synced through
     */
    public syncHeight: number = 0;

    /**
     * Adds a node to the graph
     */
    public addNode(node: Node) {
        this.nodes.set(node.nodeId.toString("hex"), node);
    }

    /**
     * Adds a channgel to the graph
     */
    public addChannel(channel: Channel) {
        const node1 = this.getNode(channel.nodeId1);
        const node2 = this.getNode(channel.nodeId2);
        if (!node1) throw new NodeNotFoundError(channel.nodeId1);
        if (!node2) throw new NodeNotFoundError(channel.nodeId2);

        // attach channel
        const key = channel.shortChannelId.toNumber();
        this.channels.set(key, channel);

        // attach channel to node 1
        node1.linkChannel(channel);

        // attach channel to node 2
        node2.linkChannel(channel);
    }

    /**
     * Gets a node in the graph
     */
    public getNode(nodeId: Buffer): Node {
        return this.nodes.get(nodeId.toString("hex"));
    }

    /**
     * Gets a node in the channel by shortChannelId
     */
    public getChannel(shortChannelId: ShortChannelId) {
        return this.channels.get(shortChannelId.toNumber());
    }

    /**
     * Removes the node from the graph
     */
    public removeChannel(channel: Channel) {
        const key = channel.shortChannelId.toNumber();
        const n1 = this.getNode(channel.nodeId1);
        const n2 = this.getNode(channel.nodeId2);

        // remove from channels list
        this.channels.delete(key);

        // detach from node 1
        n1.unlinkChannel(channel);

        // detach from node 2
        n2.unlinkChannel(channel);
    }
}
