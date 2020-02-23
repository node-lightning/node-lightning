// tslint:disable: no-unused-expression
import { expect } from "chai";
import { GossipMemoryStore } from "../../lib/gossip/gossip-memory-store";
import { ChannelAnnouncementMessage } from "../../lib/messages/channel-announcement-message";
import { ChannelUpdateMessage } from "../../lib/messages/channel-update-message";
import { NodeAnnouncementMessage } from "../../lib/messages/node-announcement-message";
import { ShortChannelId } from "../../lib/shortchanid";

describe("GossipMemoryStore", () => {
  const sut = new GossipMemoryStore();
  const scid = new ShortChannelId(1, 2, 3);
  const node1 = Buffer.alloc(32, 1);
  const node2 = Buffer.alloc(32, 2);

  describe(".saveChannelAnnouncement()", () => {
    it("should store the channel_announcement message", async () => {
      const msg = new ChannelAnnouncementMessage();
      msg.shortChannelId = scid;
      msg.nodeId1 = node1;
      msg.nodeId2 = node2;
      await sut.saveChannelAnnouncement(msg);
      const actual = await sut.findChannelAnnouncement(msg.shortChannelId);
      expect(actual.shortChannelId.toString()).to.equal(scid.toString());
      expect(sut.channelAnnouncementCount).to.equal(1);
    });

    it("should attach channel_announcement to node1", async () => {
      const result = await sut.findChannelsForNode(node1);
      expect(result[0].toString()).to.equal(scid.toString());
    });

    it("should attach channel_announcement to node2", async () => {
      const result = await sut.findChannelsForNode(node2);
      expect(result[0].toString()).to.equal(scid.toString());
    });
  });

  describe(".findChannelAnnouncements", () => {
    it("should find all channel_announcement messages", async () => {
      const result = await sut.findChannelAnnouncemnts();
      expect(result.length).to.equal(1);
      expect(result[0]).to.be.an.instanceOf(ChannelAnnouncementMessage);
    });
  });

  describe(".saveChannelUpdate()", () => {
    it("should store channel_update for node_1", async () => {
      const msg = new ChannelUpdateMessage();
      msg.shortChannelId = scid;
      msg.direction = 0;
      await sut.saveChannelUpdate(msg);
      const result = await sut.findChannelUpdate(scid, 0);
      expect(result.shortChannelId.toString()).to.equal(scid.toString());
      expect(result.direction).to.equal(0);
      expect(sut.channelUpdateCount).to.equal(1);
    });

    it("should store channel_update for node_2", async () => {
      const msg = new ChannelUpdateMessage();
      msg.shortChannelId = scid;
      msg.direction = 1;
      await sut.saveChannelUpdate(msg);
      const result = await sut.findChannelUpdate(scid, 1);
      expect(result.shortChannelId.toString()).to.equal(scid.toString());
      expect(result.direction).to.equal(1);
      expect(sut.channelUpdateCount).to.equal(2);
    });
  });

  describe(".saveNodeAnnouncement", () => {
    it("should store node_announcement", async () => {
      const msg = new NodeAnnouncementMessage();
      msg.nodeId = node1;
      await sut.saveNodeAnnouncement(msg);
      const result = await sut.findNodeAnnouncement(node1);
      expect(result.nodeId.toString("hex")).to.equal(node1.toString("hex"));
      expect(sut.nodeAnnouncementCount).to.equal(1);
    });
  });

  describe(".deleteNodeAnnouncement()", () => {
    it("should delete the node_announcement", async () => {
      await sut.deleteNodeAnnouncement(node1);
      expect(await sut.findNodeAnnouncement(node1)).to.be.undefined;
      expect(sut.nodeAnnouncementCount).to.equal(0);
    });
  });

  describe(".deleteChannelUpdate", () => {
    it("should delete channel_update for node_1", async () => {
      await sut.deleteChannelUpdate(scid, 0);
      expect(await sut.findChannelUpdate(scid, 0)).to.be.undefined;
      expect(sut.channelUpdateCount).to.equal(1);
    });

    it("should delete channel_update for node_2", async () => {
      await sut.deleteChannelUpdate(scid, 1);
      expect(await sut.findChannelUpdate(scid, 0)).to.be.undefined;
      expect(sut.channelUpdateCount).to.equal(0);
    });
  });

  describe(".deleteChannelAnnouncement()", () => {
    it("should remove the channel_announcement", async () => {
      await sut.deleteChannelAnnouncement(scid);
      expect(await sut.findChannelAnnouncement(scid)).to.be.undefined;
      expect(sut.channelAnnouncementCount).to.equal(0);
    });

    it("should unlink from node_1", async () => {
      const results = await sut.findChannelsForNode(node1);
      expect(results.length).to.equal(0);
    });

    it("should unlink from node_2", async () => {
      const results = await sut.findChannelsForNode(node2);
      expect(results.length).to.equal(0);
    });

    it("should unlink channel_update for node_1", async () => {
      const results = await sut.findChannelUpdate(scid, 0);
    });

    it("should unlink channel_update for node_2", async () => {
      const results = await sut.findChannelUpdate(scid, 1);
    });

    it("should delete outpoint link");
  });
});
