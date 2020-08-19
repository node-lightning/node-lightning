import { BitcoindClient } from "@node-lightning/bitcoind";
import { ConstantBackoff, RetryPolicy } from "@node-lightning/bitcoind";
import { TxWatcher } from "@node-lightning/chainmon";
import { RocksdbGossipStore } from "@node-lightning/gossip-rocksdb";
import { GraphManager } from "@node-lightning/graph";
import { GraphError } from "@node-lightning/graph";
import { LndSerializer } from "@node-lightning/graph";
import { ConsoleTransport, Logger, LogLevel } from "@node-lightning/logger";
import { BitField } from "@node-lightning/wire";
import { ExtendedChannelAnnouncementMessage } from "@node-lightning/wire";
import { Peer } from "@node-lightning/wire";
import { GossipMemoryStore } from "@node-lightning/wire";
import { GossipManager } from "@node-lightning/wire";
import { InitFeatureFlags } from "@node-lightning/wire";
import fs from "fs";

// tslint:disable-next-line: no-var-requires
const config = require("../config.json");

const logger = new Logger("app");
logger.transports.push(new ConsoleTransport(console));
logger.level = LogLevel.Debug;

async function connectToPeer(peerInfo: { rpk: string; host: string; port: number }) {
    // local secret is obtained from the config file and
    // should be a 32-byte hex encoded ECDSA private key
    const ls = Buffer.from(config.key, "hex");

    // chainHash from the config, this should be the chainhash for testnet
    const chainHash = Buffer.from(config.chainhash, "hex");

    // configure the Bitcoind chain client that is used to
    // validate validatity of funding transactions associated
    // with channels inside the ChannelFilter
    const chainClient = new BitcoindClient({
        ...config.bitcoind,
        policyMaker: () => new RetryPolicy(5, new ConstantBackoff(5000)),
    });

    // constructs the gossip data storage and the manager for
    // controlling gossip requests with the peer.
    const gossipStore = new RocksdbGossipStore(".db");
    const pendingStore = new GossipMemoryStore();
    const gossipManager = new GossipManager(logger, gossipStore, pendingStore, chainClient);

    // attach error handling for gossip manager
    gossipManager.on("error", err => logger.error("gossip failed", err));

    // construucts a new transaction watcher which is used to watch for
    // spending of tx outpoints. This class us enables to monitor the blockchain
    // for spent outpoints and remove them from our routing view.
    const txWatcher = new TxWatcher(chainClient);

    // start the tx watcher looking for transactions
    txWatcher.start();

    // listen for new channel announcement messages. when we receive one, we will
    // add it to the chain_mon transaction watcher to see if it gets spent. once it
    // is spent, we will remove it from the routing view
    gossipManager.on("message", async msg => {
        if (msg instanceof ExtendedChannelAnnouncementMessage) {
            txWatcher.watchOutpoint(msg.outpoint);
        }
    });

    // The transaction watcher will notify us of transactions that have been spent.
    // We remove the outpoint from the routing table by deleting it from the
    // gossip manager.
    txWatcher.on("outpointspent", async (tx, outpoint) => {
        await gossipManager.removeChannelByOutpoint(outpoint);
    });

    // Construct a new graph manager. The graph manager is used to convert gossip
    // routing messages into a graph data structure. The graph manager needs to
    // constructed prior to connecting to any peers or startting the gossip
    // manager to ensure that all message are receieved.
    const graphManager = new GraphManager(gossipManager);

    // Create a flag that we will use to periodically persist the graph state to disk
    let dirtyGraph = false;

    // Listen for creation or update of nodes
    graphManager.on("node", node => {
        logger.info("node    ", node.nodeId.toString("hex"));
        dirtyGraph = true;
    });

    // Listen for the creation of new channels
    graphManager.on("channel", channel => {
        logger.info("chan_new", channel.shortChannelId.toString());
        dirtyGraph = true;
    });

    // Listen for updates to settings on one side of a channel
    graphManager.on("channel_update", (channel, settings) => {
        logger.info("chan_upd", channel.shortChannelId.toString(), settings.direction);
        dirtyGraph = true;
    });

    // Listen for graph errors
    graphManager.on("error", (err: GraphError) => {
        logger.error(err.message);
    });

    // Start the gossip manager to enable us to add peers to it. Because the graph
    // state is restored when the gossip manager starts, we must enable the graph
    // prior to starting the manager.
    await gossipManager.start();

    // constructs the supported local features which will be provided to the
    // remote node during the initialization handshake process
    const localFeatures = new BitField<InitFeatureFlags>();
    localFeatures.set(InitFeatureFlags.initialRoutingSyncOptional);
    localFeatures.set(InitFeatureFlags.optionDataLossProtectOptional);
    localFeatures.set(InitFeatureFlags.gossipQueriesOptional);

    // constructs the peer and attaches a logger for tthe peer.
    const peer = new Peer(ls, localFeatures, [chainHash], logger);
    peer.on("open", () => logger.info("connecting"));
    peer.on("error", err => logger.error("%s", err.stack));
    peer.on("ready", () => logger.info("peer is ready"));

    // adds the peer to the gossip mananger. Once the peer is
    // connected the gossip manager will take efforts to
    // synchronize information with the remote peer.
    gossipManager.addPeer(peer);

    // connect to the remote peer using the local secret provided
    // in our config file
    peer.connect(Buffer.from(peerInfo.rpk, "hex"), peerInfo.host, peerInfo.port);

    // periodically save the graph state to disk. If there were no changes
    // to the graph then nothing will be stored.
    setInterval(() => {
        if (!dirtyGraph) return;
        logger.info(
            `saving graph with ${graphManager.graph.nodes.size} nodes and ${graphManager.graph.channels.size} channels`,
        );
        const serializer = new LndSerializer();
        const result = serializer.toJSON(graphManager.graph, true);
        fs.writeFileSync("./graph.json", result);
        dirtyGraph = false;
    }, 60000);
}

connectToPeer(config.peers[0])
    .then(() => {
        process.stdin.resume();
    })
    .catch(err => {
        logger.error(err);
        process.exit(1);
    });
