import { expect } from "chai";
import { GossipManager } from "../../lib/gossip/gossip-manager";
import { GossipMemoryStore } from "../../lib/gossip/gossip-memory-store";
import { ChannelAnnouncementMessage } from "../../lib/messages/channel-announcement-message";
import { Peer } from "../../lib/peer";
import { ShortChannelId } from "../../lib/shortchanid";
import { createFakeLogger, createFakePeer } from "../_test-utils";

describe("GossipManager", () => {
  let sut: GossipManager;
  let peer1: Peer;
  before(() => {
    sut = new GossipManager({
      chainHash: Buffer.alloc(32),
      logger: createFakeLogger(),
      gossipStore: new GossipMemoryStore(),
      pendingStore: new GossipMemoryStore(),
    });
    peer1 = createFakePeer();
  });

  describe("add peer", () => {
    it("should add the peer", () => {
      sut.addPeer(peer1);
      expect(sut.peerCount).to.equal(1);
    });

    it("first peer should trigger synchronization");
  });

  describe("valid message", () => {
    it("should emit message", done => {
      const input = Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da93481d", "hex"); // prettier-ignore
      const msg = ChannelAnnouncementMessage.deserialize(input);

      // listen for message event
      sut.on("message", msg2 => {
        expect(msg2).to.equal(msg);
        done();
      });
      peer1.emit("message", msg);
    });
  });

  describe("delete channel", () => {
    it("should remove the channel", () => {
      sut.removeChannel(new ShortChannelId(1288457, 3, 0));
    });
    it("should remove node1 update");
    it("should remove node2 update");
  });

  describe("invalid message", () => {
    it("should emit error", done => {
      const input = Buffer.from("0100ce1d69dbb62e86ad28157f4c24705e325f069d5158b91b28bdf55e508afcc1b554a498f4bda8a3d34a206ddb617ad0e945ecadc9a61086bac5afae3e19976242d464e8d305772f29021a4d07617c4159e7e0634bd53991c0e0577c0e9c3d3ee61d7311e6773275335c12f17e573e2813391a71050ab58c03c17d06c0d841db2ec6c6514c2156713651dfbee13d491559764c95343386218ab904173742dde6ca3118d303967e073a44e94f16eef4d878d4d74f1ff1f6924109421cf9c41e8e5c961cf1c7e2316e61a952c7caad056fea1d13d2f4bf855bd3f06d019a33814bc70ea99fa79f026c791b87040e781e8493f5165dafbfc23fabe2912c3ed0ab7e0f000043497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea33090000000013a9090000030000036b96e4713c5f84dcb8030592e1bd42a2d9a43d91fa2e535b9bfd05f2c5def9b9039cc950286a8fa99218283d1adc2456e0d5e81be558da77dd6e85ba9a1fff5ad303ca63b9acbadf5b644c11d0a9dd65b82b14e0d26fc5e0bcf071a90879f603d46203a0ee0a716f4a436864fe53bb788a003321aee63150bf63fd5529e4e1da934810", "hex"); // prettier-ignore
      const msg = ChannelAnnouncementMessage.deserialize(input);

      // listen for message event
      sut.on("error", () => {
        done();
      });
      peer1.emit("message", msg);
    });
  });
});
