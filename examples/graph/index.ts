import { BitcoindClient } from "@lntools/bitcoind";
import { TxWatcher } from "@lntools/chainmon";
import { RocksdbGossipStore } from "@lntools/gossip-rocksdb";
import { ConsoleTransport, Logger, LogLevel } from "@lntools/logger";
import { ChannelAnnouncementMessage } from "@lntools/wire";
import { InitMessage } from "@lntools/wire";
import { ChannelUpdateMessage } from "@lntools/wire";
import { NodeAnnouncementMessage } from "@lntools/wire";
import { ExtendedChannelAnnouncementMessage } from "@lntools/wire";
import { Peer } from "@lntools/wire";
import { GossipMemoryStore } from "@lntools/wire";
import { GossipManager } from "@lntools/wire";
// import { GraphManager } from "../../packages/lntools-graph/dist/graph-manager";

// tslint:disable-next-line: no-var-requires
const config = require("./config.json");

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
  const chainClient = new BitcoindClient(config.bitcoind);

  // construucts a new transaction watcher which is used to watch for
  // spending of tx outpoints. This class us enables to monitor the blockchain
  // for spent outpoints and remove them from our routing view.
  const txWatcher = new TxWatcher(chainClient);

  // constructs the gossip data storage and the manager for
  // controlling gossip requests with the peer.
  const gossipStore = new RocksdbGossipStore(".db");
  const pendingStore = new GossipMemoryStore();
  const gossipManager = new GossipManager({
    chainHash,
    logger,
    gossipStore,
    pendingStore,
    chainClient,
  });

  // attach error handling for gossip manager
  gossipManager.on("error", err => logger.error("gossip failed", err));

  // attach a message handler for completed and validated messages
  let counter = 0;
  gossipManager.on("message", msg => {
    let extra = "";
    if (msg instanceof ChannelAnnouncementMessage) {
      extra += msg.shortChannelId.toString();
      extra += " ";
    }
    if (msg instanceof ExtendedChannelAnnouncementMessage) {
      extra += msg.outpoint.toString();
    }
    if (msg instanceof ChannelUpdateMessage) {
      extra += msg.shortChannelId.toString();
      extra += " ";
      extra += msg.direction;
    }
    if (msg instanceof NodeAnnouncementMessage) {
      extra += msg.nodeId.toString("hex");
    }

    logger.info("msg: %d, type: %d %s %s", ++counter, msg.type, msg.constructor.name, extra);
  });

  // listen for new channel announcement messages. when we receive one, we will
  // add it to the chain_mon transaction watcher to see if it gets spent. once it
  // is spent, we will remove it from the routing view
  gossipManager.on("message", async msg => {
    if (msg instanceof ExtendedChannelAnnouncementMessage) {
      txWatcher.watchOutpoint((msg as ExtendedChannelAnnouncementMessage).outpoint);
    }
  });

  // start the gossip manager to enable us to add peers to it
  await gossipManager.start();

  // The transaction watcher will notify us of transactions that have been spent.
  // We remove the outpoint from the routing table by deleting it from the
  // gossip manager.
  txWatcher.on("outpointspent", async (tx, outpoint) => {
    const msg = await gossipStore.findChannelAnnouncementByOutpoint(outpoint);
    await gossipManager.removeChannel(msg.shortChannelId);
    logger.info("removed channel", outpoint.toString());
  });

  // constructs an init message to signal to the remote
  // peer the capabilities of the current node. This
  // method is called by the peer when a valid noise
  // connection has been established.
  const initMessageFactory = () => {
    const initMessage = new InitMessage();
    initMessage.localInitialRoutingSync = false;
    initMessage.localDataLossProtect = true;
    initMessage.localGossipQueries = true;
    initMessage.localGossipQueriesEx = false;
    return initMessage;
  };

  // constructs the peer and attaches a logger for tthe peer.
  const peer = new Peer({
    ls,
    rpk: Buffer.from(peerInfo.rpk, "hex"),
    host: peerInfo.host,
    port: peerInfo.port,
    logger,
    initMessageFactory,
  });
  peer.logger = logger;
  peer.on("open", () => logger.info("connecting"));
  peer.on("error", err => logger.error("%s", err.stack));
  peer.on("ready", () => logger.info("peer is ready"));

  // adds the peer to the gossip mananger. Once the peer is
  // connected the gossip manager will take efforts to
  // synchronize information with the remote peer.
  gossipManager.addPeer(peer);

  // connect to the remote peer using the local secret provided
  // in our config file
  peer.connect();

  // constructs a graph manager to build and construct a channel
  // graph that can be used for route querying.
  // const graphManager = new GraphManager(gossipManager);
  // graphManager.on("channel", c => {
  //   logger.info("new channel", c.shortChannelId.toString(), "capacity", c.capacity);
  // });
}

connectToPeer(config.peers[0])
  .then(() => {
    process.stdin.resume();
  })
  .catch(err => {
    logger.error(err);
    process.exit(1);
  });
