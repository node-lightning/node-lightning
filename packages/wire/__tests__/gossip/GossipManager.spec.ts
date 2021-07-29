// tslint:disable: no-unused-expression

import { BitField } from "@node-lightning/core";
import { OutPoint } from "@node-lightning/core";
import { ShortChannelId } from "@node-lightning/core";
import { expect } from "chai";
import sinon from "sinon";
import { InitFeatureFlags } from "../../lib/flags/InitFeatureFlags";
import { GossipManager, SyncState } from "../../lib/gossip/GossipManager";
import { GossipMemoryStore } from "../../lib/gossip/GossipMemoryStore";
import { IGossipFilterChainClient } from "../../lib/gossip/IGossipFilterChainClient";
import { ChannelAnnouncementMessage } from "../../lib/messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "../../lib/messages/ChannelUpdateMessage";
import { ExtendedChannelAnnouncementMessage } from "../../lib/messages/ExtendedChannelAnnouncementMessage";
import { NodeAnnouncementMessage } from "../../lib/messages/NodeAnnouncementMessage";
import { Peer } from "../../lib/Peer";
import { PeerState } from "../../lib/PeerState";
import { createFakeLogger, createFakePeer } from "../_test-utils";

function createFakeChainClient() {
    return {
        getBlockHash: sinon.stub(),
        getBlock: sinon.stub(),
        getUtxo: sinon.stub(),
        waitForSync: sinon.stub(),
    };
}

describe("GossipManager", () => {
    let sut: GossipManager;
    let peer1: Peer;
    let gossipStore: GossipMemoryStore;
    let chainClient: IGossipFilterChainClient;
    beforeEach(() => {
        gossipStore = new GossipMemoryStore();
        sut = new GossipManager(createFakeLogger(), gossipStore, new GossipMemoryStore());
        peer1 = createFakePeer();
        chainClient = createFakeChainClient();
    });

    afterEach(() => {
        sut.gossipRelay.stop();
    });

    describe(".start()", () => {
        describe("no history", () => {
            it("should restore block height to 0", async () => {
                await sut.start();
                expect(sut.blockHeight).to.equal(0);
            });
        });

        describe("with history", () => {
            beforeEach(async () => {
                const msg1 = ExtendedChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481dfe010000372177777777666666665555555544444444333333332222222211111111000000000c", "hex")); // prettier-ignore
                const msg2 = ExtendedChannelAnnouncementMessage.deserialize(Buffer.from("01009b33af5fe59b236b2383ed442fa7c1361a68fe13f89f9c9712ae04b9eb13ce962584851bedf84b9682ed3c351828164d6f24fcdaf1ad577f6378c170fb68a1fac5daa19b89932d2aeaa0327aaf7da830e5b15e0d033fa62613e2a35b67fc53d02ab5f2335733dda30ba24751f33d229af579927e09a94a619dd4a4626615f1c1de45fdf85a1702805d0708bc676ddfb99b27308ea6e12fd76200c65a01c4d9fe7d9e96f20e09949d539fedeaf88cea8a2df7d28a4ddcb622559ccf1624ba61f4270e93a347b0c8329ec6c6162e450ebc0fe07611ff90d33f5b0fb9466ea306ec30e4bf688d619c903c79eacd0e05ae91ec84e370d4e572b100c19f4a3d53e172000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90e0000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b903e5f9d1935c67a029bf0a26af5f63109f4f4c45993a8f45177a8f2f39bcb46144033164d62ebff9e5c20b524dd796251113e5fe93bdafced041159cc0df8e95a28b03a3d66f3f59bf350ae414d2cc510899c684801ebd61b3b9fcf22731462ed9d80efe010000372177777777666666665555555544444444333333332222222211111111000000001c", "hex")); // prettier-ignore

                await gossipStore.saveChannelAnnouncement(msg1);
                await gossipStore.saveChannelAnnouncement(msg2);
            });

            it("should restore to highest channel's block", async () => {
                await sut.start();
                expect(sut.blockHeight).to.equal(1288462);
            });
        });

        describe("with chain_client and sync requird", () => {
            it("waits for chain sync", async () => {
                // delay sync for 100 s
                chainClient.waitForSync = () => new Promise(resolve => setTimeout(resolve, 100));

                sut = new GossipManager(
                    createFakeLogger(),
                    gossipStore,
                    new GossipMemoryStore(),
                    chainClient,
                );

                const start = Date.now();
                await sut.start();
                const end = Date.now();

                // start should be delayed by 100ms
                expect(end - start).to.be.gte(100);
            });
        });

        describe("with history and chain_client", () => {
            beforeEach(async () => {
                const msg1 = ExtendedChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481dfe010000372177777777666666665555555544444444333333332222222211111111000000000c", "hex")); // prettier-ignore
                const msg2 = ExtendedChannelAnnouncementMessage.deserialize(Buffer.from("01009b33af5fe59b236b2383ed442fa7c1361a68fe13f89f9c9712ae04b9eb13ce962584851bedf84b9682ed3c351828164d6f24fcdaf1ad577f6378c170fb68a1fac5daa19b89932d2aeaa0327aaf7da830e5b15e0d033fa62613e2a35b67fc53d02ab5f2335733dda30ba24751f33d229af579927e09a94a619dd4a4626615f1c1de45fdf85a1702805d0708bc676ddfb99b27308ea6e12fd76200c65a01c4d9fe7d9e96f20e09949d539fedeaf88cea8a2df7d28a4ddcb622559ccf1624ba61f4270e93a347b0c8329ec6c6162e450ebc0fe07611ff90d33f5b0fb9466ea306ec30e4bf688d619c903c79eacd0e05ae91ec84e370d4e572b100c19f4a3d53e172000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90e0000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b903e5f9d1935c67a029bf0a26af5f63109f4f4c45993a8f45177a8f2f39bcb46144033164d62ebff9e5c20b524dd796251113e5fe93bdafced041159cc0df8e95a28b03a3d66f3f59bf350ae414d2cc510899c684801ebd61b3b9fcf22731462ed9d80efe010000372177777777666666665555555544444444333333332222222211111111000000001c", "hex")); // prettier-ignore

                await gossipStore.saveChannelAnnouncement(msg1);
                await gossipStore.saveChannelAnnouncement(msg2);

                sut = new GossipManager(
                    createFakeLogger(),
                    gossipStore,
                    new GossipMemoryStore(),
                    chainClient,
                );
            });

            it("should restore to highest channel's block", async () => {
                await sut.start();
                expect(sut.blockHeight).to.equal(1288462);
            });

            it("should remove missing utxos", async () => {
                await sut.start();
                const results = await gossipStore.findChannelAnnouncemnts();
                expect(results.length).to.equal(0);
            });

            it("should keep valid utxos", async () => {
                (chainClient.getUtxo as any).resolves({});
                await sut.start();
                const results = await gossipStore.findChannelAnnouncemnts();
                expect(results.length).to.equal(2);
            });
        });

        describe("with history, chain_client, but not extended messages", () => {
            beforeEach(async () => {
                const msg1 = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481dfe010000372177777777666666665555555544444444333333332222222211111111000000000c", "hex")); // prettier-ignore
                const msg2 = ChannelAnnouncementMessage.deserialize(Buffer.from("01009b33af5fe59b236b2383ed442fa7c1361a68fe13f89f9c9712ae04b9eb13ce962584851bedf84b9682ed3c351828164d6f24fcdaf1ad577f6378c170fb68a1fac5daa19b89932d2aeaa0327aaf7da830e5b15e0d033fa62613e2a35b67fc53d02ab5f2335733dda30ba24751f33d229af579927e09a94a619dd4a4626615f1c1de45fdf85a1702805d0708bc676ddfb99b27308ea6e12fd76200c65a01c4d9fe7d9e96f20e09949d539fedeaf88cea8a2df7d28a4ddcb622559ccf1624ba61f4270e93a347b0c8329ec6c6162e450ebc0fe07611ff90d33f5b0fb9466ea306ec30e4bf688d619c903c79eacd0e05ae91ec84e370d4e572b100c19f4a3d53e172000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90e0000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b903e5f9d1935c67a029bf0a26af5f63109f4f4c45993a8f45177a8f2f39bcb46144033164d62ebff9e5c20b524dd796251113e5fe93bdafced041159cc0df8e95a28b03a3d66f3f59bf350ae414d2cc510899c684801ebd61b3b9fcf22731462ed9d80efe010000372177777777666666665555555544444444333333332222222211111111000000001c", "hex")); // prettier-ignore

                await gossipStore.saveChannelAnnouncement(msg1);
                await gossipStore.saveChannelAnnouncement(msg2);

                sut = new GossipManager(
                    createFakeLogger(),
                    gossipStore,
                    new GossipMemoryStore(),
                    chainClient,
                );
            });

            it("should not check channels", async () => {
                await sut.start();
                const results = await gossipStore.findChannelAnnouncemnts();
                expect(results.length).to.equal(2);
            });
        });
    });

    describe(".addPeer()", () => {
        beforeEach(async () => {
            await sut.start();
        });

        describe("first peer that is `ready`", () => {
            it("should start sync process", () => {
                peer1.state = PeerState.Ready;
                peer1.remoteFeatures = new BitField<InitFeatureFlags>();
                peer1.remoteFeatures.set(InitFeatureFlags.gossipQueriesOptional);
                sut.addPeer(peer1);
                const msg = (peer1.sendMessage as any).args[0][0];
                expect(msg.type).to.equal(263);
                expect(msg.firstBlocknum).to.equal(0);
                expect(msg.numberOfBlocks).to.equal(4294967295);
            });

            it("should start gossip_sync process on peer `ready`", () => {
                sut.addPeer(peer1);
                peer1.on("ready", () => {
                    const msg = (peer1.sendMessage as any).args[0][0];
                    expect(msg.type).to.equal(263);
                    expect(msg.firstBlocknum).to.equal(0);
                    expect(msg.numberOfBlocks).to.equal(4294967295);
                });
                peer1.state = PeerState.Ready;
                peer1.remoteFeatures = new BitField<InitFeatureFlags>();
                peer1.remoteFeatures.set(InitFeatureFlags.gossipQueriesOptional);
                peer1.emit("ready");
            });
        });

        describe("first peer that is not `ready`", () => {
            it("should start gossip_sync process on peer `ready`", () => {
                sut.addPeer(peer1);
                peer1.on("ready", () => {
                    const msg = (peer1.sendMessage as any).args[0][0];
                    expect(msg.type).to.equal(263);
                    expect(msg.firstBlocknum).to.equal(0);
                    expect(msg.numberOfBlocks).to.equal(4294967295);
                });
                peer1.state = PeerState.Ready;
                peer1.remoteFeatures = new BitField<InitFeatureFlags>();
                peer1.remoteFeatures.set(InitFeatureFlags.gossipQueriesOptional);
                peer1.emit("ready");
            });
        });

        describe("peer that is `ready`", () => {
            it("send a gossip_timestamp_filter to activate", () => {
                peer1.state = PeerState.Ready;
                peer1.remoteFeatures = new BitField<InitFeatureFlags>();
                peer1.remoteFeatures.set(InitFeatureFlags.gossipQueriesOptional);
                sut.syncState = SyncState.Synced;
                sut.addPeer(peer1);
                const msg = (peer1.sendMessage as any).args[0][0];
                expect(msg.type).to.equal(265);
                expect(msg.firstTimestamp).to.be.gte(1580946012);
                expect(msg.timestampRange).to.equal(4294967295);
            });
        });

        describe("peer that is not `ready`", () => {
            it("should start gossip reciept once peer is `ready`", () => {
                sut.addPeer(peer1);
                sut.syncState = SyncState.Synced;
                peer1.on("ready", () => {
                    const msg = (peer1.sendMessage as any).args[0][0];
                    expect(msg.type).to.equal(265);
                    expect(msg.firstTimestamp).to.be.gte(0);
                    expect(msg.timestampRange).to.equal(4294967295);
                });
                peer1.state = PeerState.Ready;
                peer1.remoteFeatures = new BitField<InitFeatureFlags>();
                peer1.remoteFeatures.set(InitFeatureFlags.gossipQueriesOptional);
                peer1.emit("ready");
            });
        });
    });

    describe("when peer", () => {
        beforeEach(async () => {
            await sut.start();
            peer1.state = PeerState.Ready;
            sut.addPeer(peer1);
        });

        describe("emits valid message", () => {
            it("should emit validated message", done => {
                const msg = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d", "hex")); // prettier-ignore
                sut.on("message", msg2 => {
                    expect(msg2).to.equal(msg);
                    done();
                });
                peer1.write(msg);
            });

            it("should update last seen blockHeight", done => {
                const msg = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d", "hex")); // prettier-ignore
                sut.on("message", () => {
                    expect(sut.blockHeight).to.equal(1288457);
                    done();
                });
                peer1.write(msg);
            });

            it("should enqueue to gossip relayer", done => {
                sut.gossipRelay.enqueue = sinon.spy();
                const msg = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d", "hex")); // prettier-ignore
                peer1.write(msg);
                sut.on("message", () => {
                    expect((sut.gossipRelay.enqueue as any).called).to.be.true;
                    done();
                });
            });
        });

        describe("emits invalid message", () => {
            it("should emit error", done => {
                const msg = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da934810", "hex")); // prettier-ignore
                sut.on("error", () => {
                    done();
                });
                peer1.write(msg);
            });
        });
    });

    describe(".removeChannel()", () => {
        beforeEach(async () => {
            const msg1 = ExtendedChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481dfe010000372177777777666666665555555544444444333333332222222211111111000000000c", "hex")); // prettier-ignore
            await gossipStore.saveChannelAnnouncement(msg1);
        });

        it("should remove the channel", async () => {
            const scid = new ShortChannelId(1288457, 3, 0);
            expect(await gossipStore.findChannelAnnouncement(scid)).to.be.instanceOf(ExtendedChannelAnnouncementMessage); // prettier-ignore
            await sut.removeChannel(new ShortChannelId(1288457, 3, 0));
            expect(await gossipStore.findChannelAnnouncement(scid)).to.be.undefined;
        });
    });

    describe(".removeChannelByOutpoint()", () => {
        beforeEach(async () => {
            const msg1 = ExtendedChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481dfe010000372177777777666666665555555544444444333333332222222211111111000000000c", "hex")); // prettier-ignore
            await gossipStore.saveChannelAnnouncement(msg1);
        });

        it("should remove the channel", async () => {
            const outpoint = new OutPoint(
                "7777777766666666555555554444444433333333222222221111111100000000",
                12,
            );
            expect(await gossipStore.findChannelAnnouncementByOutpoint(outpoint)).to.be.instanceOf(ExtendedChannelAnnouncementMessage); // prettier-ignore
            await sut.removeChannelByOutpoint(outpoint);
            expect(await gossipStore.findChannelAnnouncementByOutpoint(outpoint)).to.be.undefined;
        });
    });

    describe(".allMessages()", () => {
        it("happy path", async () => {
            const msg1 = new ChannelAnnouncementMessage();
            msg1.shortChannelId = new ShortChannelId(1, 1, 1);
            msg1.nodeId1 = Buffer.alloc(32, 1);
            msg1.nodeId2 = Buffer.alloc(32, 2);
            await gossipStore.saveChannelAnnouncement(msg1);

            const msg2 = new ChannelUpdateMessage();
            msg2.shortChannelId = new ShortChannelId(1, 1, 1);
            msg2.channelFlags = BitField.fromNumber(0);
            await gossipStore.saveChannelUpdate(msg2);

            const msg3 = new ChannelUpdateMessage();
            msg3.shortChannelId = new ShortChannelId(1, 1, 1);
            msg3.channelFlags = BitField.fromNumber(1);
            await gossipStore.saveChannelUpdate(msg3);

            const msg4 = new NodeAnnouncementMessage();
            msg4.nodeId = Buffer.alloc(32, 1);
            await gossipStore.saveNodeAnnouncement(msg4);

            const msg5 = new NodeAnnouncementMessage();
            msg5.nodeId = Buffer.alloc(32, 2);
            await gossipStore.saveNodeAnnouncement(msg5);

            const msg6 = new ChannelAnnouncementMessage();
            msg6.shortChannelId = new ShortChannelId(2, 2, 2);
            msg6.nodeId1 = Buffer.alloc(32, 1);
            msg6.nodeId2 = Buffer.alloc(32, 2);
            await gossipStore.saveChannelAnnouncement(msg6);

            const msg7 = new ChannelUpdateMessage();
            msg7.shortChannelId = new ShortChannelId(2, 2, 2);
            msg7.messageFlags.set(0);
            await gossipStore.saveChannelUpdate(msg7);

            // orphaned node_ann
            const msg8 = new NodeAnnouncementMessage();
            msg8.nodeId = Buffer.alloc(32, 3);
            await gossipStore.saveNodeAnnouncement(msg8);

            const actual = [];
            for await (const msg of sut.allMessages()) {
                actual.push(msg);
            }

            expect(actual.length).to.equal(8);
            expect(actual[0]).to.be.instanceof(ChannelAnnouncementMessage);
            expect(actual[1]).to.be.instanceof(ChannelUpdateMessage);
            expect(actual[2]).to.be.instanceof(ChannelUpdateMessage);
            expect(actual[3]).to.be.instanceof(NodeAnnouncementMessage);
            expect(actual[4]).to.be.instanceof(NodeAnnouncementMessage);
            expect(actual[5]).to.be.instanceof(ChannelAnnouncementMessage);
            expect(actual[6]).to.be.instanceof(ChannelUpdateMessage);
            expect(actual[7]).to.be.instanceOf(NodeAnnouncementMessage);
        });
    });
});
