/* eslint-disable @typescript-eslint/no-unsafe-argument */
// tslint:disable: no-unused-expression

import { BitField } from "../../lib/BitField";
import { OutPoint } from "@node-lightning/bitcoin";
import { ShortChannelId } from "../../lib/domain/ShortChannelId";
import { expect } from "chai";
import sinon from "sinon";
import { GossipFilter } from "../../lib/gossip/GossipFilter";
import { InitFeatureFlags } from "../../lib/flags/InitFeatureFlags";
import { GossipManager } from "../../lib/gossip/GossipManager";
import { GossipMemoryStore } from "../../lib/gossip/GossipMemoryStore";
import { IGossipFilterChainClient } from "../../lib/gossip/IGossipFilterChainClient";
import { ChannelAnnouncementMessage } from "../../lib/messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "../../lib/messages/ChannelUpdateMessage";
import { ExtendedChannelAnnouncementMessage } from "../../lib/messages/ExtendedChannelAnnouncementMessage";
import { NodeAnnouncementMessage } from "../../lib/messages/NodeAnnouncementMessage";
import { PeerState } from "../../lib/PeerState";
import { createFakeLogger, createFakePeer } from "../_test-utils";
import { SyncState } from "../../lib/gossip/SyncState";
import { MessageFactory, WireErrorCode } from "../../lib";
import { WireMessageResult } from "../../lib/WireMessageResult";

function createFakeChainClient() {
    return {
        getBlockHash: sinon.stub(),
        getBlockSummary: sinon.stub(),
        getUtxo: sinon.stub(),
        waitForSync: sinon.stub(),
    };
}

describe("GossipManager", () => {
    let sut: GossipManager;
    let peer1: any;
    let gossipStore: GossipMemoryStore;
    let gossipFilter: GossipFilter;
    let chainClient: IGossipFilterChainClient;
    beforeEach(() => {
        gossipStore = new GossipMemoryStore();
        gossipFilter = new GossipFilter(gossipStore, new GossipMemoryStore());
        sut = new GossipManager(createFakeLogger(), gossipFilter, chainClient);
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

                sut = new GossipManager(createFakeLogger(), gossipFilter, chainClient);

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

                sut = new GossipManager(createFakeLogger(), gossipFilter, chainClient);
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

                sut = new GossipManager(createFakeLogger(), gossipFilter, chainClient);
            });

            it("should not check channels", async () => {
                await sut.start();
                const results = await gossipStore.findChannelAnnouncemnts();
                expect(results.length).to.equal(2);
            });
        });
    });

    describe(".onPeerReady()", () => {
        beforeEach(async () => {
            await sut.start();
        });

        it("when unsynced should start sync process", () => {
            peer1.state = PeerState.Ready;
            peer1.remoteFeatures = new BitField<InitFeatureFlags>();
            peer1.remoteFeatures.set(InitFeatureFlags.gossipQueriesOptional);
            sut.onPeerReady(peer1);
            const msg = (peer1.sendMessage as any).args[0][0];
            expect(msg.type).to.equal(263);
            expect(msg.firstBlocknum).to.equal(0);
            expect(msg.numberOfBlocks).to.equal(4294967295);
        });

        it("send a gossip_timestamp_filter to activate", () => {
            peer1.state = PeerState.Ready;
            peer1.remoteFeatures = new BitField<InitFeatureFlags>();
            peer1.remoteFeatures.set(InitFeatureFlags.gossipQueriesOptional);
            sut.syncState = SyncState.Synced;
            sut.onPeerReady(peer1);
            const msg = (peer1.sendMessage as any).args[0][0];
            expect(msg.type).to.equal(265);
            expect(msg.firstTimestamp).to.be.gte(1580946012);
            expect(msg.timestampRange).to.equal(4294967295);
        });
    });

    describe(".onWireMessage()", () => {
        beforeEach(async () => {
            await sut.start();
            peer1.state = PeerState.Ready;
            sut.onPeerReady(peer1);
        });

        describe("valid message", () => {
            it("should emit validated message", async () => {
                const msg = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d", "hex")); // prettier-ignore
                await sut.onWireMessage(peer1, msg);
                // TODO chain of responsibility?
            });

            it("should update last seen blockHeight", async () => {
                const msg = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d", "hex")); // prettier-ignore
                await sut.onWireMessage(peer1, msg);
                expect(sut.blockHeight).to.equal(1288457);
            });

            it("should enqueue to gossip relayer", async () => {
                sut.gossipRelay.enqueue = sinon.spy();
                const msg = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d", "hex")); // prettier-ignore
                await sut.onWireMessage(peer1, msg);
                expect((sut.gossipRelay.enqueue as any).called).to.be.true;
            });
        });

        describe("emits invalid message", () => {
            it("should emit error", async () => {
                const msg = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da934810", "hex")); // prettier-ignore
                await sut.onWireMessage(peer1, msg);
                // TODO how to handle this?
            });
        });

        describe("integation - wire messages", () => {
            it("it should process all valid messages", async () => {
                const hexMsgs = [
                    "0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d",
                    "01024e6eac97124742ba6a033612c8009945c0d52568756a885692b4adbf202666503b56ecb6f5758ea450dda940b2a6853b8e1706c3bd4f38a347be91b08c5e5c4743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90900000300005cdd9d780002009000000000000003e8000003e800000001",
                    "01015254ffbc21374af9d998355151515933de1d998e9cb124aa4d65a7aa6b473e75201420c58f2414f4fb7461f3f133ab529cbbf9a57365ed6bcf775172826fdc7500005ae86dba039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad3f8e71c79616c6c732e6f7267000000000000000000000000000000000000000000000000070122c8fc922607",
                    "0102fcd0d7af22e815879e2ba0c2422bc812d04f8b286fd53e631fe18bb6ed5aecc06a0b96fceb352509656f2b121b76cc808fe02e62ff42edc600bd6e196fe2af9b43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90900000300005ae7cc490001009000000000000003e8000003e800000001",
                    "010105d3b12aacb824409ce8724609fe453fdcd33a498ecca170784985c4a6a2765657c4ef9e1170d3a5795ec86021c3a081c84a9f3a02e2ca66d17b683baacae08000005cddd5e5036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9b6d43364656d6f312e6c6e646578706c6f7265722e636f6d0000000000000000000000000701265736a32611",
                ];

                const results = [];
                for (const hexMsg of hexMsgs) {
                    const msg = MessageFactory.deserialize(Buffer.from(hexMsg, "hex"));
                    const result = await sut.onWireMessage(peer1, msg);
                    results.push(result);
                }
                expect(results.length).to.equal(hexMsgs.length);
            });

            it("it should continue processing after errors", async () => {
                const hexMsgs = [
                    "0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d",
                    "01024e6eac97124742ba6a033612c8009945c0d52568756a885692b4adbf202666503b56ecb6f5758ea450dda940b2a6853b8e1706c3bd4f38a347be91b08c5e5c4743497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90900000300005cdd9d780002009000000000000003e8000003e800000001",
                    "01010254ffbc21374af9d998355151515933de1d998e9cb124aa4d65a7aa6b473e75201420c58f2414f4fb7461f3f133ab529cbbf9a57365ed6bcf775172826fdc7500005ae86dba039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad3f8e71c79616c6c732e6f7267000000000000000000000000000000000000000000000000070122c8fc922607",
                    "0102fcd0d7af22e815879e2ba0c2422bc812d04f8b286fd53e631fe18bb6ed5aecc06a0b96fceb352509656f2b121b76cc808fe02e62ff42edc600bd6e196fe2af9b43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90900000300005ae7cc490001009000000000000003e8000003e800000001",
                    "010105d3b12aacb824409ce8724609fe453fdcd33a498ecca170784985c4a6a2765657c4ef9e1170d3a5795ec86021c3a081c84a9f3a02e2ca66d17b683baacae08000005cddd5e5036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9b6d43364656d6f312e6c6e646578706c6f7265722e636f6d0000000000000000000000000701265736a32611",
                ];

                const results: WireMessageResult[] = [];
                for (const hexMsg of hexMsgs) {
                    const msg = MessageFactory.deserialize(Buffer.from(hexMsg, "hex"));
                    const result = await sut.onWireMessage(peer1, msg);
                    results.push(result);
                }
                expect(results.length).to.equal(hexMsgs.length);
                expect(results.filter(p => p.isErr).length).to.equal(1);
                for (const result of results) {
                    if (result.isErr) {
                        expect(result.error.code).to.equal(WireErrorCode.nodeAnnSigFailed);
                    }
                }
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
