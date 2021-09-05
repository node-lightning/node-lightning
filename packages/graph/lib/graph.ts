import { ShortChannelId } from "@node-lightning/core";
import { ChannelSettings } from ".";
import { Channel } from "./channel";
import { NodeNotFoundError } from "./graph-error";
import { Node } from "./node";

/**
 * Graph represents a
 */
export class Graph {
    public nodes_list: string[] = [];
    public adjacencyList = {};
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
        // Adding node_id's to the list
        this.nodes_list.push(node.nodeId.toString("hex"));
        // Whenever we add a node each node has its own adjacency list to store its connections in adjacency object
        this.adjacencyList[node.nodeId.toString("hex")] = {};
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
        // The edge added b/w two nodes is the key that can be used to access the channel prop. later using map.get(),
        // which then can be later used to do computations accordingly during dijkstra.
        this.adjacencyList[node1.nodeId.toString("hex")][node2.nodeId.toString("hex")] = key;
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
        let distances = {},
            // Parents will be used to find the path from dest to src later
            parents = {},
            visited = new Set();
        for (let i = 0; i < this.nodes_list.length; i++) {
            if (this.nodes_list[i] === str_id) {
                distances[str_id] = 0;
            } else {
                distances[this.nodes_list[i]] = Infinity;
            }
            parents[this.nodes_list[i]] = null;
        }

        let currnode = this.nodeWithMinDistance(distances, visited);

        while (currnode !== null) {
            let distance = distances[currnode],
                neighbors = this.adjacencyList[currnode];
            for (let neighbor in neighbors) {
                // lets get the channel sid using key stored as an edge for each node link connected to the `currnode`
                let sid = this.channels.get(neighbors[neighbor]);
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
                    (nodeSettings.htlcMaximumMsat // htlcMaximumMsat is optional maybe undefined
                        ? nodeSettings.htlcMaximumMsat
                        : 0 < amnt && nodeSettings.htlcMinimumMsat > amnt && sid.capacity > amnt) // Checking if channel capacity is > amnt to transfer
                )
                    continue;
                if (distances[neighbor] > newDistance) {
                    distances[neighbor] = newDistance;
                    parents[neighbor] = currnode;
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
            sidRoute.push(this.channels.get(this.adjacencyList[parent[dest]][dest]).shortChannelId);
            dest = parent[dest];
        }
        return sidRoute.reverse();
    }

    private nodeWithMinDistance(distances: { [x: string]: any }, visited: Set<unknown>) {
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
