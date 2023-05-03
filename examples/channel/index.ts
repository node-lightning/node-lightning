import { BitcoindClient } from "@node-lightning/bitcoind";
import { BlockWatcher, ChannelWallet } from "@node-lightning/lightning-bitcoind";
import { Logger, ConsoleTransport, LogLevel } from "@node-lightning/logger";

import config from "../config.json";
import { Block, HashValue, Network, Value } from "@node-lightning/bitcoin";
import {
    BitField,
    ChannelManager,
    InitFeatureFlags,
    LightningEvent,
    OpenChannelRequest,
    Peer,
    TransitionFactory,
} from "@node-lightning/lightning";
import { ChannelPreferences } from "@node-lightning/lightning";
import { Helpers } from "@node-lightning/lightning";
import { StateMachineFactory } from "@node-lightning/lightning";
import { PeerManager } from "@node-lightning/lightning";
import { LightningEventQueue } from "@node-lightning/lightning";
import { LightningEventMuxer } from "@node-lightning/lightning";
import { ChannelStorage } from "./ChannelStorage";
import { PeerRepository } from "@node-lightning/lightning";

async function run() {
    // construct the logger
    const logger = new Logger("app");
    logger.transports.push(new ConsoleTransport(console));
    logger.level = LogLevel.Debug;

    // construct a bitcoind client
    const bitcoind = new BitcoindClient(config.bitcoind);

    // initialize environment
    const count = await bitcoind.getBlockCount();
    const address = await bitcoind.getNewAddress();
    if (count < 100) {
        await bitcoind.generateToAddress(100, address);
    }

    // start mining blocks every ~5s
    setInterval(() => {
        void bitcoind.generateToAddress(1, address);
    }, Math.random() * 2000 + 9000);

    // genesis block
    Network.regtest.genesisHash = HashValue.fromRpc(await bitcoind.getBlockHash(0));

    // construct bitcoind wallet
    const wallet = new ChannelWallet(logger, Network.regtest, bitcoind);

    // block producer
    const blockProducer = new BlockWatcher(bitcoind, undefined, undefined, undefined, logger);
    blockProducer.start();

    // const preferences
    const preferences = new ChannelPreferences();

    // need a root event handler here
    const peerRepo = new PeerRepository();

    const channelStorage = new ChannelStorage("./");
    const channelLogic = new Helpers(wallet, preferences, peerRepo);
    const transitionFactory = new TransitionFactory(logger, channelLogic, channelStorage);
    const channelStateMachineFactory = new StateMachineFactory(logger, transitionFactory);

    const channelManager = new ChannelManager(
        logger,
        Network.regtest,
        channelLogic,
        channelStorage,
        channelStateMachineFactory.construct(),
    );

    const gossipManager = undefined;

    const eventMuxer = new LightningEventMuxer(logger, gossipManager, channelManager);
    const eventQueue = new LightningEventQueue(eventMuxer);

    blockProducer.onBlockConnected = async (block: Block) => {
        eventQueue.push(LightningEvent.createBlockConnected(block));
    };

    const peerManager = new PeerManager(peerRepo, eventQueue);

    // chainHash from the config, this should be the chainhash for testnet
    const chainHash = Buffer.from(config.chainhash, "hex");

    // local secret is obtained from the config file and
    // should be a 32-byte hex encoded ECDSA private key
    const ls = Buffer.from(config.key, "hex");
    const localFeatures = new BitField<InitFeatureFlags>();
    localFeatures.set(InitFeatureFlags.optionStaticRemoteKeyRequired);
    localFeatures.set(InitFeatureFlags.optionDataLossProtectRequired);

    const peerInfo = config.peers[1];
    const peer = new Peer(ls, localFeatures, [chainHash], logger);
    peer.connect(Buffer.from(peerInfo.rpk, "hex"), peerInfo.host, peerInfo.port);

    peerManager.addPeer(peer);

    const request: OpenChannelRequest = {
        peer,
        fundingAmount: Value.fromSats(1_000_000),
        pushAmount: Value.zero(),
        maxAcceptedHtlcs: 50,
        minHtlcValue: Value.fromSats(2_000),
        maxHtlcInFlightValue: Value.fromSats(50_000),
        channelReserveValue: Value.fromSats(10_000),
        toSelfBlockDelay: 144,
        publicChannel: true,
        ourOptions: localFeatures,
    };

    setTimeout(async () => {
        const result = await channelManager.openChannel(peer, request);
    }, 3000);
}

run().catch(console.error);
