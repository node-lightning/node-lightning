// tslint:disable: no-unused-expression

import { ILogger } from "@lntools/logger";
import { expect } from "chai";
import sinon from "sinon";
import { IQueryShortIdsStrategy } from "../../lib";
import { QueryChannelRangeStrategy } from "../../lib/gossip/QueryChannelRangeStrategy";
import { QueryChannelRangeMessage } from "../../lib/messages/query-channel-range-message";
import { ReplyChannelRangeMessage } from "../../lib/messages/reply-channel-range-message";
import { IWireMessage } from "../../lib/messages/wire-message";
import { ShortChannelId } from "../../lib/shortchanid";
import { createFakeLogger, createFakePeer } from "../_test-utils";

describe("QueryChannelRangeStrategy", () => {
  let chainHash: Buffer;
  let sut: QueryChannelRangeStrategy;
  let peer: any;
  let logger: ILogger;
  let channelRangeFailedEvent;

  let fakeQueryShortIdsStrategy: IQueryShortIdsStrategy;

  beforeEach(() => {
    chainHash = Buffer.alloc(32, 1);
    peer = createFakePeer();
    logger = createFakeLogger();
    fakeQueryShortIdsStrategy = {
      enqueue: sinon.stub(),
    };
    sut = new QueryChannelRangeStrategy(chainHash, peer, logger, fakeQueryShortIdsStrategy);

    channelRangeFailedEvent = sinon.stub();
    sut.on("channel_range_failed", channelRangeFailedEvent);
  });

  describe(".queryRange()", () => {
    describe("defaults, active_query=false", () => {
      beforeEach(() => {
        sut.queryRange();
      });

      it("should send query_channel_range", () => {
        const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
        expect(msg.firstBlocknum).to.equal(0);
        expect(msg.numberOfBlocks).to.equal(4294967295);
      });

      it("should have awaiting_range_query_reply state", () => {
        expect(sut.awaitingReply).to.be.true;
      });
    });

    describe("defaults, active_query=true", () => {
      beforeEach(() => {
        (sut as any)._blocked = true;
        sut.queryRange();
      });

      it("should not send a query_channel_range message", () => {
        expect((fakeQueryShortIdsStrategy.enqueue as any).called).to.equal(false);
      });

      it("should have awaiting_range_query_reply state", () => {
        expect(sut.awaitingReply).to.be.true;
      });
    });

    describe("options, active_query=false", () => {
      beforeEach(() => {
        sut.queryRange(1000000, 1000);
      });

      it("should send query_channel_range", () => {
        const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
        expect(msg.firstBlocknum).to.equal(1000000);
        expect(msg.numberOfBlocks).to.equal(1000);
      });

      it("should have awaiting_range_query_reply state", () => {
        expect(sut.awaitingReply).to.be.true;
      });
    });

    describe("options, active_query=true", () => {
      beforeEach(() => {
        (sut as any)._blocked = true;
        sut.queryRange(1000000, 1000);
      });

      it("should not send a query_channel_range message", () => {
        expect(peer.sendMessage.callCount).to.equal(0);
      });

      it("should have awaiting_range_query_reply state", () => {
        expect(sut.awaitingReply).to.be.true;
      });
    });

    describe("overflow, active_query=false", () => {
      beforeEach(() => {
        sut.queryRange(1000);
      });

      it("should send query_channel_range", () => {
        const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
        expect(msg.firstBlocknum).to.equal(1000);
        expect(msg.numberOfBlocks).to.equal(4294966295);
      });

      it("should have awaiting_range_query_reply state", () => {
        expect(sut.awaitingReply).to.be.true;
      });
    });

    describe("overflow, active_query=true", () => {
      beforeEach(() => {
        (sut as any)._blocked = true;
        sut.queryRange(1000);
      });

      it("should not send a query_channel_range message", () => {
        expect((fakeQueryShortIdsStrategy.enqueue as any).called).to.equal(false);
      });

      it("should have awaiting_range_query_reply state", () => {
        expect(sut.awaitingReply).to.be.true;
      });
    });
  });

  // legacy single reply
  // legacy multi reply
  // legacy multi reply with queue
  // standard single reply
  // standard single reply with queue
  // standard multi reply with queue

  describe("legacy reply_channel_range", () => {
    describe("complete=true, with_scids=true, queued_query=false", () => {
      beforeEach(() => {
        sut.queryRange(0, 4294967295);

        const msg = new ReplyChannelRangeMessage();
        msg.fullInformation = true;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        msg.firstBlocknum = 0;
        msg.numberOfBlocks = 4294967295;
        peer.emit("message", msg);
      });

      it("should enqueue scids", () => {
        const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
        expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should not be awaiting range query reply", () => {
        expect(sut.awaitingReply).to.be.false;
      });
    });

    describe("full_info=true, with_scids=true, queued_query=true", () => {
      beforeEach(() => {
        sut.queryRange(0, 4294967295);
        sut.queryRange(1000, 2000);

        const msg = new ReplyChannelRangeMessage();
        msg.fullInformation = true;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        msg.firstBlocknum = 0;
        msg.numberOfBlocks = 4294967295;
        peer.emit("message", msg);
      });

      it("should enqueue message", () => {
        const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
        expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should be awaiting range query reply", () => {
        expect(sut.awaitingReply).to.be.true;
      });

      it("should send queued range_query", () => {
        const msg = peer.sendMessage.args[1][0] as QueryChannelRangeMessage;
        expect(msg.firstBlocknum).to.equal(1000);
        expect(msg.numberOfBlocks).to.equal(2000);
      });
    });

    describe("full_info=true, with_scids=false, queued_query=false", () => {
      beforeEach(() => {
        sut.queryRange(0, 4294967295);
        const msg = new ReplyChannelRangeMessage();
        msg.fullInformation = true;
        msg.firstBlocknum = 0;
        msg.numberOfBlocks = 4294967295;
        msg.shortChannelIds = [];
        peer.emit("message", msg);
      });

      it("should not enqueue nessages", () => {
        expect((fakeQueryShortIdsStrategy.enqueue as any).called).to.equal(false);
      });

      it("should not be awaiting range query reply", () => {
        expect(sut.awaitingReply).to.be.false;
      });
    });

    describe("full_info=true, with_scids=false, queued_query=true", () => {
      beforeEach(() => {
        sut.queryRange(0, 4294967295);
        sut.queryRange(1000, 2000);

        const msg = new ReplyChannelRangeMessage();
        msg.fullInformation = true;
        msg.firstBlocknum = 0;
        msg.numberOfBlocks = 4294967295;
        msg.shortChannelIds = [];
        peer.emit("message", msg);
      });

      it("should not send query_short_channel_ids", () => {
        expect(peer.sendMessage.callCount).to.equal(2);
        const msg = peer.sendMessage.args[1][0] as IWireMessage;
        expect(msg.type).to.equal(263);
      });

      it("should be awaiting range query reply", () => {
        expect(sut.awaitingReply).to.be.true;
      });

      it("should send queued range_query", () => {
        const msg = peer.sendMessage.args[1][0] as QueryChannelRangeMessage;
        expect(msg.firstBlocknum).to.equal(1000);
        expect(msg.numberOfBlocks).to.equal(2000);
      });
    });

    describe("full_info=false, with_scids=true, queued_query=false", () => {
      beforeEach(() => {
        sut.queryRange(0, 4294967295);
        const msg = new ReplyChannelRangeMessage();
        msg.fullInformation = false;
        msg.firstBlocknum = 0;
        msg.numberOfBlocks = 4294967295;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        peer.emit("message", msg);
      });

      it("should enqueue message", () => {
        const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
        expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should not be awaiting range query reply", () => {
        expect(sut.awaitingReply).to.be.false;
      });

      it("switches to legacy", () => {
        expect(sut.isLegacy).to.be.true;
      });
    });

    describe("full_info=false, with_scids=true, queued_query=false", () => {
      beforeEach(() => {
        sut.queryRange(0, 4294967295);
        const msg = new ReplyChannelRangeMessage();
        msg.fullInformation = false;
        msg.firstBlocknum = 0;
        msg.numberOfBlocks = 4294967295;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        peer.emit("message", msg);
      });

      it("should enqueue message", () => {
        const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
        expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should not be awaiting range query reply", () => {
        expect(sut.awaitingReply).to.be.false;
      });

      it("switches to legacy", () => {
        expect(sut.isLegacy).to.be.true;
      });
    });

    describe("full_info=false, with_scids=true, queued_query=true", () => {
      beforeEach(() => {
        sut.queryRange(0, 4294967295);
        sut.queryRange(1000, 2000);

        const msg = new ReplyChannelRangeMessage();
        msg.fullInformation = false;
        msg.firstBlocknum = 0;
        msg.numberOfBlocks = 4294967295;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        peer.emit("message", msg);
      });

      it("should enqueue message", () => {
        const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
        expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should be awaiting range query reply", () => {
        expect(sut.awaitingReply).to.be.true;
      });

      it("should send queued range_query", () => {
        const msg = peer.sendMessage.args[1][0] as QueryChannelRangeMessage;
        expect(msg.firstBlocknum).to.equal(1000);
        expect(msg.numberOfBlocks).to.equal(2000);
      });

      it("switches to legacy", () => {
        expect(sut.isLegacy).to.be.true;
      });
    });
  });

  describe("failed reply", () => {
    let hasError: boolean;

    beforeEach(() => {
      sut.queryRange(0, 4294967295);
      sut.queryRange(1000, 2000);
      sut.on("channel_range_failed", () => (hasError = true));

      const msg = new ReplyChannelRangeMessage();
      msg.fullInformation = false;
      msg.firstBlocknum = 0;
      msg.numberOfBlocks = 4294967295;
      msg.shortChannelIds = [];
      peer.emit("message", msg);
    });

    it("emits error", () => {
      expect(hasError).to.equal(true);
    });

    it("sends next queued item", () => {
      const msg = peer.sendMessage.args[1][0] as QueryChannelRangeMessage;
      expect(msg.firstBlocknum).to.equal(1000);
      expect(msg.numberOfBlocks).to.equal(2000);
    });
  });

  describe("single reply", () => {
    beforeEach(() => {
      sut.queryRange(0, 1000);
      sut.queryRange(1000, 2000);

      const msg = new ReplyChannelRangeMessage();
      msg.fullInformation = true;
      msg.firstBlocknum = 0;
      msg.numberOfBlocks = 1000;
      msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
      peer.emit("message", msg);
    });

    it("should enqueue scids", () => {
      const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
      expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
    });

    it("sends next queued item", () => {
      const msg = peer.sendMessage.args[1][0] as QueryChannelRangeMessage;
      expect(msg.firstBlocknum).to.equal(1000);
      expect(msg.numberOfBlocks).to.equal(2000);
    });
  });

  describe("multi reply incomplete", () => {
    beforeEach(() => {
      sut.queryRange(0, 1000);
      sut.queryRange(1000, 2000);

      const msg = new ReplyChannelRangeMessage();
      msg.fullInformation = true;
      msg.firstBlocknum = 0;
      msg.numberOfBlocks = 500;
      msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
      peer.emit("message", msg);
    });

    it("should enqueue scids", () => {
      const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
      expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
    });

    it("does not send next item", () => {
      expect(peer.sendMessage.callCount).to.equal(1); // just our first send
    });
  });

  describe("multi reply complete", () => {
    beforeEach(() => {
      sut.queryRange(0, 1000);
      sut.queryRange(1000, 2000);

      const msg = new ReplyChannelRangeMessage();
      msg.fullInformation = true;
      msg.firstBlocknum = 0;
      msg.numberOfBlocks = 500;
      msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
      peer.emit("message", msg);

      const msg2 = new ReplyChannelRangeMessage();
      msg2.fullInformation = true;
      msg2.firstBlocknum = 500;
      msg2.numberOfBlocks = 500;
      msg2.shortChannelIds.push(new ShortChannelId(500, 1, 1));
      peer.emit("message", msg2);
    });

    it("should enqueue scids", () => {
      const scids1 = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
      expect(scids1[0]).to.deep.equal(new ShortChannelId(1, 1, 1));

      const scids2 = (fakeQueryShortIdsStrategy.enqueue as any).args[1];
      expect(scids2[0]).to.deep.equal(new ShortChannelId(500, 1, 1));
    });

    it("sends next item", () => {
      const msg = peer.sendMessage.args[1][0] as QueryChannelRangeMessage;
      expect(msg.firstBlocknum).to.equal(1000);
      expect(msg.numberOfBlocks).to.equal(2000);
    });
  });
});
