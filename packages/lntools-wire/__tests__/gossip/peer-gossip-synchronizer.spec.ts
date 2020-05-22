// tslint:disable: no-unused-expression

import { ILogger } from "@lntools/logger";
import { expect } from "chai";
import sinon from "sinon";
import { PeerGossipSynchronizer } from "../../lib/gossip/peer-gossip-synchronizer";
import { GossipTimestampFilterMessage } from "../../lib/messages/gossip-timestamp-filter-message";
import { QueryChannelRangeMessage } from "../../lib/messages/query-channel-range-message";
import { QueryShortChannelIdsMessage } from "../../lib/messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../../lib/messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "../../lib/messages/reply-short-channel-ids-end-message";
import { IWireMessage } from "../../lib/messages/wire-message";
import { ShortChannelId } from "../../lib/shortchanid";
import { createFakeLogger, createFakePeer } from "../_test-utils";

describe("PeerGossipSynchronizer", () => {
  let chainHash: Buffer;
  let sut: PeerGossipSynchronizer;
  let peer: any;
  let logger: ILogger;
  let channelRangeFailedEvent;
  let shortIdsQueryFailedEvent;

  beforeEach(() => {
    chainHash = Buffer.alloc(32, 1);
    peer = createFakePeer();
    logger = createFakeLogger();
    sut = new PeerGossipSynchronizer(chainHash, peer, logger);

    channelRangeFailedEvent = sinon.stub();
    sut.on("channel_range_failed", channelRangeFailedEvent);

    shortIdsQueryFailedEvent = sinon.stub();
    sut.on("query_short_channel_ids_failed", shortIdsQueryFailedEvent);
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
        expect(peer.sendMessage.callCount).to.equal(0);
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
        expect(peer.sendMessage.callCount).to.equal(0);
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

      it("should send query_short_channel_ids", () => {
        const msg = peer.sendMessage.args[0][0] as QueryShortChannelIdsMessage;
        expect(msg.shortChannelIds[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
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

      it("should send query_short_channel_ids", () => {
        const msg = peer.sendMessage.args[0][0] as QueryShortChannelIdsMessage;
        expect(msg.shortChannelIds[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should be awaiting range query reply", () => {
        expect(sut.awaitingRangeQueryReply).to.be.true;
      });

      it("should send queued range_query", () => {
        const msg = peer.sendMessage.args[1][0] as QueryChannelRangeMessage;
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

      it("should not send query_short_channel_ids", () => {
        expect(peer.sendMessage.callCount).to.equal(0);
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

      it("should send query_short_channel_ids", () => {
        const msg = peer.sendMessage.args[0][0] as QueryShortChannelIdsMessage;
        expect(msg.shortChannelIds[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
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

      it("should send query_short_channel_ids", () => {
        const msg = peer.sendMessage.args[0][0] as QueryShortChannelIdsMessage;
        expect(msg.shortChannelIds[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
      });

      it("should be awaiting range query reply", () => {
        expect(sut.awaitingRangeQueryReply).to.be.true;
      });

      it("should send queued range_query", () => {
        const msg = peer.sendMessage.args[1][0] as QueryChannelRangeMessage;
        expect(msg.firstBlocknum).to.equal(1000);
        expect(msg.numberOfBlocks).to.equal(2000);
      });
    });

    describe("complete=false, with_scids=false, queued_range_query=false", () => {
      beforeEach(() => {
        const msg = new ReplyChannelRangeMessage();
        msg.complete = false;
        msg.shortChannelIds = [];
        peer.emit("message", msg);
      });

      it("should not send query_short_channel_ids", () => {
        expect(peer.sendMessage.callCount).to.equal(0);
      });

      it("should not be awaiting range query reply", () => {
        expect(sut.awaitingRangeQueryReply).to.be.false;
      });

      it("should emit channel_range_failed", () => {
        expect(channelRangeFailedEvent.called).to.be.true;
        const msg = channelRangeFailedEvent.args[0][0];
        expect(msg).to.be.instanceOf(ReplyChannelRangeMessage);
      });
    });

    describe("complete=false, with_scids=false, queued_range_query=true", () => {
      beforeEach(() => {
        (sut as any)._awaitingRangeQueryReply = true;
        sut.queryRange(1000, 2000);

        const msg = new ReplyChannelRangeMessage();
        msg.complete = false;
        msg.shortChannelIds = [];
        peer.emit("message", msg);
      });

      it("should not send query_short_channel_ids", () => {
        expect(peer.sendMessage.callCount).to.equal(1);
        const msg = peer.sendMessage.args[0][0] as IWireMessage;
        expect(msg.type).to.equal(263);
      });

      it("should emit channel_range_failed", () => {
        expect(channelRangeFailedEvent.called).to.be.true;
        const msg = channelRangeFailedEvent.args[0][0];
        expect(msg).to.be.instanceOf(ReplyChannelRangeMessage);
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

  describe("event: receive reply_short_channel_ids_end", () => {
    describe("msg_complete=true, queued_scids=false", () => {
      beforeEach(() => {
        const msg = new ReplyShortChannelIdsEndMessage();
        msg.complete = true;
        peer.emit("message", msg);
      });

      it("should not send any message", () => {
        expect(peer.sendMessage.callCount).to.equal(0);
      });
    });

    describe("msg_complete=true, queued_scids=true", () => {
      beforeEach(() => {
        (sut as any)._queryScidQueue.push(new ShortChannelId(2, 2, 2));
        const msg = new ReplyShortChannelIdsEndMessage();
        msg.complete = true;
        peer.emit("message", msg);
      });

      it("should send query_short_channel_ids", () => {
        const msg = peer.sendMessage.args[0][0];
        expect(msg).to.be.instanceOf(QueryShortChannelIdsMessage);
        expect(msg.shortChannelIds).to.deep.equal([new ShortChannelId(2, 2, 2)]);
      });
    });

    describe("msg_complete=false, queued_scids=false", () => {
      beforeEach(() => {
        const msg = new ReplyShortChannelIdsEndMessage();
        msg.complete = false;
        peer.emit("message", msg);
      });

      it("should not send any message", () => {
        expect(peer.sendMessage.callCount).to.equal(0);
      });

      it("should emit query_short_ids_failed", () => {
        expect(shortIdsQueryFailedEvent.called).to.be.true;
        const msg = shortIdsQueryFailedEvent.args[0][0] as ReplyShortChannelIdsEndMessage;
        expect(msg).to.be.instanceOf(ReplyShortChannelIdsEndMessage);
      });
    });

    describe("msg_complete=false, queued_scids=true", () => {
      beforeEach(() => {
        (sut as any)._queryScidQueue.push(new ShortChannelId(2, 2, 2));
        const msg = new ReplyShortChannelIdsEndMessage();
        msg.complete = false;
        peer.emit("message", msg);
      });

      it("should emit query_short_ids_failed", () => {
        expect(shortIdsQueryFailedEvent.called).to.be.true;
        const msg = shortIdsQueryFailedEvent.args[0][0] as ReplyShortChannelIdsEndMessage;
        expect(msg).to.be.instanceOf(ReplyShortChannelIdsEndMessage);
      });

      it("should send query_short_channel_ids", () => {
        const msg = peer.sendMessage.args[0][0];
        expect(msg).to.be.instanceOf(QueryShortChannelIdsMessage);
        expect(msg.shortChannelIds).to.deep.equal([new ShortChannelId(2, 2, 2)]);
      });
    });
  });
});
