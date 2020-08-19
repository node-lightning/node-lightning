# @node-lightning/graph

This library constructs a graph as an adjacency list from P2P gossip messages.

This class includes the following types:

-   [GraphManger](/lib/graph-manager.ts) - constructs a graph from gossip messages
-   [Graph](/lib/graph.ts) - adjacency list representation of a graph
-   [Node](/lib/node.ts) - vertex in the graph
-   [Channel](/lib/channel.ts) - directional edge in the graph
-   [ChannelSettings](/lib/channel-settings.ts) - one directional edge information

## Examples

Message from a gossip emitter (defined in @node-lightning/wire) will be used to
construct an adjacency list based graph.

```typescript
const graphManager = new GossipManager(gossipEmitter);

graphManager.on("node", (node: Node) => {
    //
});

graphManager.on("channel", (channel: Channel) => {
    //
});

graphManager.on("channel_update", (channel: Channel, settings: ChannelSettings) => {
    //
});
```

The following events are emitted for the corresponding gossip message:

**channel_announcement message**

-   emits node event for node1 in channel
-   emits node event for node2 in channel
-   emits channel

**channel_update message**

-   emits channel_update event

**node_announcement message**

-   emits node event

### LND Serialization

You can serialize the graph instance in the same manner as the serialization
used in LND RPC calls.

```typescript
const serializer = new LndSerializer();
// to a plain-old JavaScript object
serializer.toObject(graph);

// to JSON
serializer.toJson(graph);
```
