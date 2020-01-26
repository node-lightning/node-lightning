import { BitcoindClient } from "@lntools/bitcoind";
import { LogLevel, manager } from "@lntools/logger";
import { InitMessage } from "@lntools/wire";
import { Peer } from "@lntools/wire";
import { GossipMemoryStore } from "@lntools/wire";
import { GossipManager } from "@lntools/wire";

// tslint:disable-next-line: no-var-requires
const config = require("./config.json");

manager.level = LogLevel.Debug;
const logger = manager.create("root");

async function connectToPeer(peerInfo: { rpk: string; host: string; port: number }) {
  // local secret is obtained from the config file and
  // should be a 32-byte hex encoded ECDSA private key
  const ls = Buffer.from(config.key, "hex");

  // configure the Bitcoind chain client that is used to
  // validate validatity of funding transactions associated
  // with channels inside the ChannelFilter
  const chainClient = new BitcoindClient(config.bitcoind);

  // chainHash from the config, this should be for testnet
  const chainHash = Buffer.from(config.chainhash, "hex");

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
  const peer = new Peer(initMessageFactory);
  peer.logger = logger;
  peer.on("open", () => logger.info("connecting"));
  peer.on("error", err => logger.error("%s", err.stack));
  peer.on("ready", () => logger.info("peer is ready"));

  // constructs the gossip data storage and the manager for
  // controlling gossip requests with the peer.
  const gossipStore = new GossipMemoryStore();
  const pendingStore = new GossipMemoryStore();
  const gossipManager = new GossipManager({
    chainHash,
    logger,
    gossipStore,
    pendingStore,
    chainClient,
  });
  let counter = 0;
  gossipManager.on("message", msg => logger.info("msg: %d, type: %d", ++counter, msg.type));
  gossipManager.on("error", err => logger.error("gossip failed", err));

  // adds the peer to the gossip mananger. Once the peer is
  // connected the gossip manager will take efforts to
  // synchronize information with the remote peer.
  gossipManager.addPeer(peer);

  // connect to the remote peer using the local secret provided
  // in our config file
  console.log(peerInfo);
  peer.connect({
    ls,
    rpk: Buffer.from(peerInfo.rpk, "hex"),
    host: peerInfo.host,
    port: peerInfo.port,
  });
}

connectToPeer(config.peers[0])
  .then(() => {
    process.stdin.resume();
  })
  .catch(err => {
    logger.error(err);
    process.exit(1);
  });
