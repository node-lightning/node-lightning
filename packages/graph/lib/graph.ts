import { ShortChannelId } from "@node-lightning/core";
import { ChannelSettings } from ".";
import { Channel } from "./channel";
import { NodeNotFoundError } from "./graph-error";
import { Node } from "./node";

/**
 * Graph represents a
 */
export class Graph {
    // Map containing all sids based on given nodes
    public adjacencyList: Map<{ nodea: string; nodeb: string }, bigint> = new Map();
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
     * Adds a channel to the graph
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
        // Adjacency List is required to store all the channel links and it can be traversed using the node_id's
        // The edge added b/w two nodes is the key that can be used to access the channel prop. later using map.get().
        this.adjacencyList.set(
            { nodea: node1.nodeId.toString("hex"), nodeb: node2.nodeId.toString("hex") },
            key,
        );
        this.adjacencyList.set(
            { nodea: node2.nodeId.toString("hex"), nodeb: node1.nodeId.toString("hex") },
            key,
        );
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

    public dijkstra(src: Node, dest: Node, amnt: bigint) {
        // Here we will be first computing route using reverse dijkstra that is
        // from dest --> src and return route from src --> dest

        // Convert it to corresponding node_id
        const str_id = dest.nodeId.toString("hex");

        // Distances will store the base_fee required to traverse from the src
        let distances: Map<string, number> = new Map(),
            // Parents will be used to find the path from dest to src later
            parents: Map<string, string> = new Map(),
            visited = new Set();
        for (const key of this.nodes.keys()) {
            if (key === str_id) {
                distances[str_id] = 0;
            } else {
                distances[key] = Infinity;
            }
            parents[key] = null;
        }

        let currnode = this.nodeWithMinDistance(distances, visited);

        while (currnode !== null) {
            let distance = distances[currnode];
            // Node already contains map for its channel we can use it
            for (let sid of this.nodes.get(currnode).channels.values()) {
                // Traversing each channel for the corresponding current node and storing its neighbor id for further ref.
                const nodeIdNeighbor: string =
                    sid.nodeId1.toString("hex") === currnode
                        ? sid.nodeId2.toString("hex")
                        : sid.nodeId1.toString("hex");
                // We add base fee required to pass through that node as well as `feeProportionalMillionths` on initial amnt.
                // Fee would be taken from neighbor node --> currnode we need to figure out which node is neighbor node
                // in channel link.
                let nodeSettings: ChannelSettings =
                    sid.nodeId1.toString("hex") === currnode
                        ? sid.node2Settings
                        : sid.node1Settings;
                let newDistance =
                    distance + nodeSettings
                        ? nodeSettings.feeBaseMsat
                        : Infinity +
                          (nodeSettings
                              ? nodeSettings.feeProportionalMillionths * Number(amnt)
                              : 0);
                // A check to see if the our side of channel node can transfer the amnt required
                if (
                    nodeSettings && // null check is required in case of testing
                    !nodeSettings.disabled && // If disabled is true that means no routing through this node
                    (nodeSettings.htlcMaximumMsat // htlcMaximumMsat is optional maybe undefined
                        ? nodeSettings.htlcMaximumMsat
                        : 0 < amnt && nodeSettings.htlcMinimumMsat > amnt && sid.capacity > amnt) // Checking if channel capacity is > amnt to transfer
                )
                    continue;
                if (distances[nodeIdNeighbor] > newDistance) {
                    distances[nodeIdNeighbor] = newDistance;
                    parents[nodeIdNeighbor] = currnode;
                }
            }

            visited.add(currnode);
            currnode = this.nodeWithMinDistance(distances, visited);
        }
        // Lets return the route if exists from src to dest
        return this.path_ret(str_id, src.nodeId.toString("hex"), parents).length
            ? this.path_ret(str_id, src.nodeId.toString("hex"), parents)
            : null;
    }

    private path_ret(src: string, dest: string, parent: {}) {
        let sidRoute = [];
        while (parent[dest] != null) {
            sidRoute.push(this.adjacencyList.get({ nodea: parent[dest], nodeb: dest }));
            dest = parent[dest];
        }
        return sidRoute.reverse();
    }

    private nodeWithMinDistance(distances: Map<string, number>, visited: Set<unknown>) {
        let minDistance = Infinity,
            minVertex = null;
        for (let vertex in distances) {
            let distance = distances[vertex];
            if (distance < minDistance && !visited.has(vertex)) {
                minDistance = distance;
                minVertex = vertex;
            }
        }
        return minVertex;
    }
}
