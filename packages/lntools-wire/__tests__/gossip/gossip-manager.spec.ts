import { expect } from "chai";
import sinon from "sinon";
import { IGossipFilterChainClient } from "../../lib/gossip/gossip-filter-chain-client";
import { GossipManager } from "../../lib/gossip/gossip-manager";
import { GossipMemoryStore } from "../../lib/gossip/gossip-memory-store";
import { ChannelAnnouncementMessage } from "../../lib/messages/channel-announcement-message";
import { ExtendedChannelAnnouncementMessage } from "../../lib/messages/extended-channel-announcement-message";
import { Peer } from "../../lib/peer";
import { PeerState } from "../../lib/peer-state";
import { ShortChannelId } from "../../lib/shortchanid";
import { createFakeLogger, createFakePeer } from "../_test-utils";

function createFakeChainClient() {
  return {
    getBlockHash: sinon.stub(),
    getBlock: sinon.stub(),
    getUtxo: sinon.stub(),
  };
}

describe("GossipManager", () => {
  let sut: GossipManager;
  let peer1: Peer;
  let gossipStore: GossipMemoryStore;
  let chainClient: IGossipFilterChainClient;
  beforeEach(() => {
    gossipStore = new GossipMemoryStore();
    sut = new GossipManager({
      chainHash: Buffer.alloc(32),
      logger: createFakeLogger(),
      gossipStore,
      pendingStore: new GossipMemoryStore(),
    });
    peer1 = createFakePeer();
    chainClient = createFakeChainClient();
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

    describe("with history and chain_client", () => {
      beforeEach(async () => {
        const msg1 = ExtendedChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481dfe010000372177777777666666665555555544444444333333332222222211111111000000000c", "hex")); // prettier-ignore
        const msg2 = ExtendedChannelAnnouncementMessage.deserialize(Buffer.from("01009b33af5fe59b236b2383ed442fa7c1361a68fe13f89f9c9712ae04b9eb13ce962584851bedf84b9682ed3c351828164d6f24fcdaf1ad577f6378c170fb68a1fac5daa19b89932d2aeaa0327aaf7da830e5b15e0d033fa62613e2a35b67fc53d02ab5f2335733dda30ba24751f33d229af579927e09a94a619dd4a4626615f1c1de45fdf85a1702805d0708bc676ddfb99b27308ea6e12fd76200c65a01c4d9fe7d9e96f20e09949d539fedeaf88cea8a2df7d28a4ddcb622559ccf1624ba61f4270e93a347b0c8329ec6c6162e450ebc0fe07611ff90d33f5b0fb9466ea306ec30e4bf688d619c903c79eacd0e05ae91ec84e370d4e572b100c19f4a3d53e172000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a90e0000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b903e5f9d1935c67a029bf0a26af5f63109f4f4c45993a8f45177a8f2f39bcb46144033164d62ebff9e5c20b524dd796251113e5fe93bdafced041159cc0df8e95a28b03a3d66f3f59bf350ae414d2cc510899c684801ebd61b3b9fcf22731462ed9d80efe010000372177777777666666665555555544444444333333332222222211111111000000001c", "hex")); // prettier-ignore

        await gossipStore.saveChannelAnnouncement(msg1);
        await gossipStore.saveChannelAnnouncement(msg2);

        sut = new GossipManager({
          chainHash: Buffer.alloc(32),
          logger: createFakeLogger(),
          gossipStore,
          pendingStore: new GossipMemoryStore(),
          chainClient,
        });
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

        sut = new GossipManager({
          chainHash: Buffer.alloc(32),
          logger: createFakeLogger(),
          gossipStore,
          pendingStore: new GossipMemoryStore(),
          chainClient,
        });
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
      it("should start gossip_sync process", () => {
        peer1.state = PeerState.ready;
        sut.addPeer(peer1);
        const msg = (peer1.sendMessage as any).args[1][0];
        expect(msg.type).to.equal(263);
        expect(msg.firstBlocknum).to.equal(0);
        expect(msg.numberOfBlocks).to.equal(4294967295);
      });
    });

    describe("first peer that is not `ready`", () => {
      it("should start gossip_sync process once peer is `ready`", () => {
        sut.addPeer(peer1);
        peer1.on("ready", () => {
          const msg = (peer1.sendMessage as any).args[1][0];
          expect(msg.type).to.equal(263);
          expect(msg.firstBlocknum).to.equal(0);
          expect(msg.numberOfBlocks).to.equal(4294967295);
        });
        peer1.emit("ready");
      });
    });

    describe("peer that is `ready`", () => {
      it("send a gossip_timestamp_filter to activate", () => {
        peer1.state = PeerState.ready;
        sut.addPeer(peer1);
        const msg = (peer1.sendMessage as any).args[0][0];
        expect(msg.type).to.equal(265);
        expect(msg.firstTimestamp).to.be.gte(1580946012);
        expect(msg.timestampRange).to.equal(4294967295);
      });
    });

    describe("peer that is not `ready`", () => {
      it("should start gossip_sync process once peer is `ready`", () => {
        sut.addPeer(peer1);
        peer1.on("ready", () => {
          const msg = (peer1.sendMessage as any).args[0][0];
          expect(msg.type).to.equal(265);
          expect(msg.firstTimestamp).to.be.gte(1580946012);
          expect(msg.timestampRange).to.equal(4294967295);
        });
        peer1.emit("ready");
      });
    });
  });

  describe("when peer", () => {
    beforeEach(async () => {
      await sut.start();
      sut.addPeer(peer1);
    });

    describe("emits valid message", () => {
      it("should emit validated message", done => {
        const msg = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d", "hex")); // prettier-ignore
        sut.on("message", msg2 => {
          expect(msg2).to.equal(msg);
          done();
        });
        peer1.emit("message", msg);
      });
    });

    describe("emits invalid message", () => {
      it("should emit error", done => {
        const msg = ChannelAnnouncementMessage.deserialize(Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da934810", "hex")); // prettier-ignore
        sut.on("error", () => {
          done();
        });
        peer1.emit("message", msg);
      });
    });
  });

  describe(".removeChannel()", () => {
    it("should remove the channel", async () => {
      await sut.removeChannel(new ShortChannelId(1288457, 3, 0));
    });
  });
});
