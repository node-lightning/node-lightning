import { Logger } from "@lntools/logger";
import { expect } from "chai";
import sinon from "sinon";
import { GossipSyncer } from "../../lib/gossip/gossip-syncer";
import { ActiveState } from "../../lib/gossip/states/active-state";
import { AwaitingChannelRangeCompleteState } from "../../lib/gossip/states/awaiting-channel-range-complete-state";
import { AwaitingShortIdsCompleteState } from "../../lib/gossip/states/awaiting-short-ids-complete-state";
import { InactiveState } from "../../lib/gossip/states/inactive-state";
import { GossipTimestampFilterMessage } from "../../lib/messages/gossip-timestamp-filter-message";
import { QueryShortChannelIdsMessage } from "../../lib/messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../../lib/messages/reply-channel-range-message";
import { IPeerMessageReceiver, IPeerMessageSender } from "../../lib/peer";
import { ShortChannelId } from "../../lib/shortchanid";

function createFakePeer() {
  return {
    _handlers: [],
    on(type, handler) {
      this._handlers.push([type, handler]);
      return this;
    },
    emit(type, msg) {
      this._handlers.filter(p => p[0] === type).forEach(p => p[1](msg));
    },
    sendMessage: sinon.stub(),
  } as any;
}

function createFakeLogger() {
  return sinon.createStubInstance(Logger);
}

describe("GossipSyncer", () => {
  let sut: GossipSyncer;
  let peer: any;
  let logger: Logger;
  beforeEach(() => {
    peer = createFakePeer();
    logger = createFakeLogger();
    sut = new GossipSyncer({ peer, chainHash: Buffer.alloc(32, 1), logger });
  });

  describe("state: awaiting_channel_range_complete", () => {
    beforeEach(() => {
      sut.state = new AwaitingChannelRangeCompleteState({ context: sut, logger });
    });

    it("state is 'awaiting_channel_range_complete'", () => {
      expect(sut.state.name).to.equal("awaiting_channel_range_complete");
    });

    describe("onReplyChannelRange", () => {
      describe("complete=false, short_channel_ids=[]", () => {
        function createMsg() {
          const msg = new ReplyChannelRangeMessage();
          msg.complete = false;
          return msg;
        }
        it("transitions to InactiveState", () => {
          peer.emit("message", createMsg());
          expect(sut.state).to.be.instanceOf(InactiveState);
        });
      });

      describe("complete=false, short_channel_ids=[...]", () => {
        function createMsg() {
          const msg = new ReplyChannelRangeMessage();
          msg.complete = false;
          msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
          return msg;
        }
        it("enqueues short_channel_ids", () => {
          peer.emit("message", createMsg());
          expect(sut.hasQueuedShortIds).to.equal(true);
        });

        it("should not transition state", () => {
          const priorState = sut.state;
          peer.emit("message", createMsg());
          expect(sut.state).to.equal(priorState);
        });
      });

      describe("complete=true, short_channel_ids=[]", () => {
        function createMsg() {
          const msg = new ReplyChannelRangeMessage();
          msg.complete = true;
          return msg;
        }

        it("sends gossip_timestamp_filter", () => {
          peer.emit("message", createMsg());
          const call = peer.sendMessage;
          expect((peer.sendMessage as any).called).to.equal(true);
          const msg = (peer.sendMessage as any).args[0][0] as GossipTimestampFilterMessage;
          expect(msg).to.be.instanceOf(GossipTimestampFilterMessage);
          expect(msg.chainHash).to.equal(sut.chainHash);
          expect(msg.firstTimestamp).be.gte(Math.trunc(Date.now() / 1000));
          expect(msg.timestampRange).to.equal(4294967295);
        });

        it("transitions to Active state", () => {
          peer.emit("message", createMsg());
          expect(sut.state).to.be.instanceOf(ActiveState);
        });
      });

      describe("complete=true, short_channel_ids=[...]", () => {
        function createMsg() {
          const msg = new ReplyChannelRangeMessage();
          msg.complete = true;
          msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
          msg.shortChannelIds.push(new ShortChannelId(2, 2, 2));
          return msg;
        }

        it("sends query_short_ids", () => {
          peer.emit("message", createMsg());
          expect((peer.sendMessage as any).called).to.equal(true);
          const msg = (peer.sendMessage as any).args[0][0] as QueryShortChannelIdsMessage;
          expect(msg).to.be.instanceOf(QueryShortChannelIdsMessage);
          expect(msg.chainHash).to.equal(sut.chainHash);
          expect(msg.shortChannelIds.length).to.equal(2);
          expect(msg.shortChannelIds[0].block).to.equal(1);
          expect(msg.shortChannelIds[1].block).to.equal(2);
        });

        it("transitions to AwaitingChannelRangeComplete", () => {
          peer.emit("message", createMsg());
          expect(sut.state).to.be.instanceOf(AwaitingShortIdsCompleteState);
        });
      });
    });
  });
});
