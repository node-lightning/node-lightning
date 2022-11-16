import { ConsoleTransport, Logger, LogLevel } from "@node-lightning/logger";
import { ChannelAnnouncementMessage, GossipFilter } from "@node-lightning/lightning";
import { ChannelUpdateMessage } from "@node-lightning/lightning";
import { NodeAnnouncementMessage } from "@node-lightning/lightning";
import { ExtendedChannelAnnouncementMessage } from "@node-lightning/lightning";
import { Peer } from "@node-lightning/lightning";
import { GossipMemoryStore } from "@node-lightning/lightning";
import { InitFeatureFlags } from "@node-lightning/lightning";
import { BitField } from "@node-lightning/lightning";
import { GossipManager } from "@node-lightning/lightning";
import { PeerManager } from "@node-lightning/lightning";
import { WireMessageResult } from "@node-lightning/lightning";
import { isBuffer } from "util";

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

    // constructs the gossip data storage and the manager for
    // controlling gossip requests with the peer.
    const gossipStore = new GossipMemoryStore();
    const pendingStore = new GossipMemoryStore();
    const gossipFilter = new GossipFilter(gossipStore, pendingStore);
    const gossipManager = new GossipManager(logger, gossipFilter);

    // start the gossip manager to enable us to add peers to it
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

    // connect to the remote peer using the local secret provided
    // in our config file
    peer.connect(Buffer.from(peerInfo.rpk, "hex"), peerInfo.host, peerInfo.port);

    const peerManager = new PeerManager(gossipManager);
    peerManager.addPeer(peer);

    let counter = 0;
    peerManager.afterPeerMessage = (result: WireMessageResult) => {
        const msg = result.value;
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

        if (result.isOk) {
            logger.info(
                "msg: %d, type: %d %s %s",
                ++counter,
                msg.type,
                msg.constructor.name,
                extra,
            );
        } else {
            logger.info(
                "ERROR msg: %d, type: %d %s %s",
                ++counter,
                msg.type,
                msg.constructor.name,
                extra,
            );
        }
    };
}

connectToPeer(config.peers[0])
    .then(() => {
        process.stdin.resume();
    })
    .catch(err => {
        logger.error(err);
        process.exit(1);
    });
