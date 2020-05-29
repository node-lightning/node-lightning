// tslint:disable: no-unused-expression

import { ILogger } from "@lntools/logger";
import { expect } from "chai";
import sinon from "sinon";
import { IQueryShortIdsStrategy } from "../../lib";
import { QueryChannelRangeStrategy } from "../../lib/gossip/QueryChannelRangeStrategy";
import { QueryChannelRangeMessage } from "../../lib/messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "../../lib/messages/query-short-channel-ids-message";
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

  describe("event: call .queryRange()", () => {
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
        expect(sut.awaitingRangeQueryReply).to.be.true;
      });
    });

    describe("defaults, active_query=true", () => {
      beforeEach(() => {
        (sut as any)._awaitingRangeQueryReply = true;
        sut.queryRange();
      });

      it("should not send a query_channel_range message", () => {
        expect((fakeQueryShortIdsStrategy.enqueue as any).called).to.equal(false);
      });

      it("should have awaiting_range_query_reply state", () => {
        expect(sut.awaitingRangeQueryReply).to.be.true;
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
        expect(sut.awaitingRangeQueryReply).to.be.true;
      });
    });

    describe("options, active_query=true", () => {
      beforeEach(() => {
        (sut as any)._awaitingRangeQueryReply = true;
        sut.queryRange(1000000, 1000);
      });

      it("should not send a query_channel_range message", () => {
        expect(peer.sendMessage.callCount).to.equal(0);
      });

      it("should have awaiting_range_query_reply state", () => {
        expect(sut.awaitingRangeQueryReply).to.be.true;
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
        expect(sut.awaitingRangeQueryReply).to.be.true;
      });
    });

    describe("overflow, active_query=true", () => {
      beforeEach(() => {
        (sut as any)._awaitingRangeQueryReply = true;
        sut.queryRange(1000);
      });

      it("should not send a query_channel_range message", () => {
        expect((fakeQueryShortIdsStrategy.enqueue as any).called).to.equal(false);
      });

      it("should have awaiting_range_query_reply state", () => {
        expect(sut.awaitingRangeQueryReply).to.be.true;
      });
    });
  });

  describe("event: receive reply_channel_range", () => {
    describe("msg_complete=true, msg_with_scids=true, queued_range_query=false", () => {
      beforeEach(() => {
        const msg = new ReplyChannelRangeMessage();
        msg.complete = true;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        peer.emit("message", msg);
      });

      it("should enqueue message", () => {
        const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
        expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should not be awaiting range query reply", () => {
        expect(sut.awaitingRangeQueryReply).to.be.false;
      });
    });

    describe("msg_complete=true, msg_with_scids=true, queued_range_query=true", () => {
      beforeEach(() => {
        (sut as any)._awaitingRangeQueryReply = true;
        sut.queryRange(1000, 2000);

        const msg = new ReplyChannelRangeMessage();
        msg.complete = true;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        peer.emit("message", msg);
      });

      it("should enqueue message", () => {
        const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
        expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should be awaiting range query reply", () => {
        expect(sut.awaitingRangeQueryReply).to.be.true;
      });

      it("should send queued range_query", () => {
        const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
        expect(msg.firstBlocknum).to.equal(1000);
        expect(msg.numberOfBlocks).to.equal(2000);
      });
    });

    describe("msg_complete=true, msg_with_scids=false, queued_range_query=false", () => {
      beforeEach(() => {
        const msg = new ReplyChannelRangeMessage();
        msg.complete = true;
        msg.shortChannelIds = [];
        peer.emit("message", msg);
      });

      it("should not enqueue nessages", () => {
        expect((fakeQueryShortIdsStrategy.enqueue as any).called).to.equal(false);
      });

      it("should not be awaiting range query reply", () => {
        expect(sut.awaitingRangeQueryReply).to.be.false;
      });
    });

    describe("msg_complete=true, msg_with_scids=false, queued_range_query=true", () => {
      beforeEach(() => {
        (sut as any)._awaitingRangeQueryReply = true;
        sut.queryRange(1000, 2000);

        const msg = new ReplyChannelRangeMessage();
        msg.complete = true;
        msg.shortChannelIds = [];
        peer.emit("message", msg);
      });

      it("should not send query_short_channel_ids", () => {
        expect(peer.sendMessage.callCount).to.equal(1);
        const msg = peer.sendMessage.args[0][0] as IWireMessage;
        expect(msg.type).to.equal(263);
      });

      it("should be awaiting range query reply", () => {
        expect(sut.awaitingRangeQueryReply).to.be.true;
      });

      it("should send queued range_query", () => {
        const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
        expect(msg.firstBlocknum).to.equal(1000);
        expect(msg.numberOfBlocks).to.equal(2000);
      });
    });

    describe("msg_complete=false, msg_with_scids=true, queued_range_query=false", () => {
      beforeEach(() => {
        const msg = new ReplyChannelRangeMessage();
        msg.complete = false;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        peer.emit("message", msg);
      });

      it("should enqueue message", () => {
        const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
        expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should not be awaiting range query reply", () => {
        expect(sut.awaitingRangeQueryReply).to.be.false;
      });
    });

    describe("msg_complete=false, msg_with_scids=true, queued_range_query=true", () => {
      beforeEach(() => {
        (sut as any)._awaitingRangeQueryReply = true;
        sut.queryRange(1000, 2000);

        const msg = new ReplyChannelRangeMessage();
        msg.complete = false;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        peer.emit("message", msg);
      });

      it("should enqueue message", () => {
        const scids = (fakeQueryShortIdsStrategy.enqueue as any).args[0];
        expect(scids[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should be awaiting range query reply", () => {
        expect(sut.awaitingRangeQueryReply).to.be.true;
      });

      it("should send queued range_query", () => {
        const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
        expect(msg.firstBlocknum).to.equal(1000);
        expect(msg.numberOfBlocks).to.equal(2000);
      });
    });
  });
});
