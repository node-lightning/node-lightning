import { ConsoleTransport, Logger, LogLevel } from "@lntools/logger";
import { BitField } from "@lntools/wire";
import { QueryChannelRangeOptions } from "@lntools/wire";
import { QueryShortChannelIdsMessage } from "@lntools/wire";
import { ShortChannelId } from "@lntools/wire";
import { QueryShortChannelIdsFlags } from "@lntools/wire";
import { QueryChannelRangeMessage } from "@lntools/wire";
import { Peer } from "@lntools/wire";
import { InitFeatureFlags } from "@lntools/wire/dist/flags/InitFeatureFlags";

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
    peer.on("sending", buf => logger.info("send", buf.toString("hex")));
    peer.on("message", msg => logger.info(JSON.stringify(msg)));
    // peer.on("rawmessage", buf => logger.info("raw", buf.toString("hex")));

    // send a message
    peer.on("ready", () => {
        // full range query
        const msg = new QueryChannelRangeMessage();
        msg.chainHash = chainHash;
        msg.firstBlocknum = 0;
        msg.numberOfBlocks = 4294967295;
        peer.sendMessage(msg);
        //
        // partial range query
        // const msg = new QueryChannelRangeMessage();
        // msg.chainHash = chainHash;
        // msg.firstBlocknum = 1630000;
        // msg.numberOfBlocks = 4294967295 - 1630000;
        // peer.sendMessage(msg);
        //
        // small range query
        // const msg = new QueryChannelRangeMessage();
        // msg.chainHash = chainHash;
        // msg.firstBlocknum = 1630000;
        // msg.numberOfBlocks = 2000;
        // peer.sendMessage(msg);
        //
        // smaller area with tlv
        // const msg = new QueryChannelRangeMessage();
        // msg.chainHash = chainHash;
        // msg.firstBlocknum = 1630000;
        // msg.numberOfBlocks = 2000;
        // msg.options = new QueryChannelRangeOptions();
        // msg.options.checksum = true;
        // msg.options.timestamp = true;
        // peer.sendMessage(msg);
        //
        // scid query
        // const msg = new QueryShortChannelIdsMessage();
        // msg.chainHash = chainHash
        // msg.shortChannelIds.push(new ShortChannelId(1630300, 1, 0));
        // msg.shortChannelIds.push(new ShortChannelId(1631517, 4, 0));
        // peer.sendMessage(msg);
        //
        // scid query with tlvs
        // const msg = new QueryShortChannelIdsMessage();
        // msg.chainHash = chainHash;
        // msg.shortChannelIds.push(new ShortChannelId(1630300, 1, 0));
        // msg.shortChannelIds.push(new ShortChannelId(1631517, 4, 0));
        // msg.flags = new QueryShortChannelIdsFlags();
        // msg.flags.addFlags(new Bitmask(BigInt("0b11111")), new Bitmask(BigInt("0b11111")));
        // peer.sendMessage(msg);
        //
        // timestamp filter
        // const msg = new GossipTimestampFilterMessage();
        // msg.chainHash = chainHash
        // msg.firstTimestamp = 1451606400; // 2016-01-01
        // msg.firstTimestamp = 1578441600; // 2020-01-01
        // msg.firstTimestamp = 1578591431; // 2020-01-09 17:37:11
        // msg.firstTimestamp = 1578600000;
        // msg.timestampRange = 4294967295; // (1 << 32) - 1;
        // peer.sendMessage(msg);
    });

    // connect to the remote peer using the local secret provided in our config file
    peer.connect(Buffer.from(peerInfo.rpk, "hex"), peerInfo.host, peerInfo.port);
}

connectToPeer(config.peers[0])
    .then(() => {
        process.stdin.resume();
    })
    .catch(err => {
        logger.error(err);
        process.exit(1);
    });
