import { Logger } from "@lntools/logger";
import { expect } from "chai";
import sinon from "sinon";
import { PeerGossipSynchronizer } from "../../lib/gossip/peer-gossip-synchronizer";
import { GossipTimestampFilterMessage } from "../../lib/messages/gossip-timestamp-filter-message";
import { QueryShortChannelIdsMessage } from "../../lib/messages/query-short-channel-ids-message";
import { ReplyChannelRangeMessage } from "../../lib/messages/reply-channel-range-message";
import { ReplyShortChannelIdsEndMessage } from "../../lib/messages/reply-short-channel-ids-end-message";
import { ShortChannelId } from "../../lib/shortchanid";
import { createFakePeer } from "../_test-utils";

function createFakeLogger() {
  return sinon.createStubInstance(Logger);
}

describe("PeerGossipSynchronizer", () => {
  let sut: PeerGossipSynchronizer;
  let peer: any;
  let logger: Logger;
  beforeEach(() => {
    peer = createFakePeer();
    logger = createFakeLogger();
    sut = new PeerGossipSynchronizer({ peer, chainHash: Buffer.alloc(32, 1), logger });
  });

  describe(".syncRange()", () => {
    describe("query_state: pending", () => {
      it("should construct and send query_channel_range");
      it("should transition to awaiting_ranges");
    });

    // describe("query_state: awaiting_ranges", () => {

    // });
  });

  // describe("state: awaiting_channel_range_complete", () => {
  //   beforeEach(() => {
  //     sut.state = new AwaitingChannelRangeCompleteState();
  //   });

  //   it("state is 'awaiting_channel_range_complete'", () => {
  //     expect(sut.state.name).to.equal("awaiting_channel_range_complete");
  //   });

  //   describe("on reply_channel_range message", () => {
  //     describe("complete=false, short_channel_ids=[]", () => {
  //       function createMsg() {
  //         const msg = new ReplyChannelRangeMessage();
  //         msg.complete = false;
  //         return msg;
  //       }
  //       it("transitions to Inactive state", () => {
  //         peer.emit("message", createMsg());
  //         expect(sut.state).to.be.instanceOf(InactiveState);
  //       });
  //     });

  //     describe("complete=false, short_channel_ids=[...]", () => {
  //       function createMsg() {
  //         const msg = new ReplyChannelRangeMessage();
  //         msg.complete = false;
  //         msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
  //         return msg;
  //       }
  //       it("enqueues short_channel_ids", () => {
  //         peer.emit("message", createMsg());
  //         expect(sut.hasQueuedShortIds).to.equal(true);
  //       });

  //       it("should not transition state", () => {
  //         const priorState = sut.state;
  //         peer.emit("message", createMsg());
  //         expect(sut.state).to.equal(priorState);
  //       });
  //     });

  //     describe("complete=true, short_channel_ids=[]", () => {
  //       function createMsg() {
  //         const msg = new ReplyChannelRangeMessage();
  //         msg.complete = true;
  //         return msg;
  //       }

  //       it("sends gossip_timestamp_filter", () => {
  //         peer.emit("message", createMsg());
  //         expect((peer.sendMessage as any).called).to.equal(true);
  //         const msg = (peer.sendMessage as any).args[0][0] as GossipTimestampFilterMessage;
  //         expect(msg).to.be.instanceOf(GossipTimestampFilterMessage);
  //         expect(msg.chainHash).to.equal(sut.chainHash);
  //         expect(msg.firstTimestamp).be.gte(Math.trunc(Date.now() / 1000));
  //         expect(msg.timestampRange).to.equal(4294967295);
  //       });

  //       it("transitions to Active state", () => {
  //         peer.emit("message", createMsg());
  //         expect(sut.state).to.be.instanceOf(ActiveState);
  //       });
  //     });

  //     describe("complete=true, short_channel_ids=[...]", () => {
  //       function createMsg() {
  //         const msg = new ReplyChannelRangeMessage();
  //         msg.complete = true;
  //         msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
  //         msg.shortChannelIds.push(new ShortChannelId(2, 2, 2));
  //         return msg;
  //       }

  //       it("sends query_short_ids", () => {
  //         peer.emit("message", createMsg());
  //         expect((peer.sendMessage as any).called).to.equal(true);
  //         const msg = (peer.sendMessage as any).args[0][0] as QueryShortChannelIdsMessage;
  //         expect(msg).to.be.instanceOf(QueryShortChannelIdsMessage);
  //         expect(msg.chainHash).to.equal(sut.chainHash);
  //         expect(msg.shortChannelIds.length).to.equal(2);
  //         expect(msg.shortChannelIds[0].block).to.equal(1);
  //         expect(msg.shortChannelIds[1].block).to.equal(2);
  //       });

  //       it("transitions to AwaitingShortIdsComplete state", () => {
  //         peer.emit("message", createMsg());
  //         expect(sut.state).to.be.instanceOf(AwaitingShortIdsCompleteState);
  //       });
  //     });
  //   });
  // });

  // describe("state: awaiting_short_ids_end", () => {
  //   beforeEach(() => {
  //     sut.state = new AwaitingShortIdsCompleteState();
  //   });

  //   describe("on reply_short_channel_ids_end message", () => {
  //     describe("complete=false", () => {
  //       function createMsg() {
  //         const msg = new ReplyShortChannelIdsEndMessage();
  //         msg.complete = false;
  //         return msg;
  //       }
  //       it("transitions to inactive", () => {
  //         peer.emit("message", createMsg());
  //         expect(sut.state).to.be.instanceOf(InactiveState);
  //       });
  //     });

  //     describe("complete=true, hasQueuedShortIds=true", () => {
  //       function createMsg() {
  //         const msg = new ReplyShortChannelIdsEndMessage();
  //         msg.complete = true;
  //         return msg;
  //       }

  //       it("sends query_short_channel_ids message", () => {
  //         sut.enqueueShortChannelIds([new ShortChannelId(3, 3, 3)]);
  //         peer.emit("message", createMsg());
  //         expect((peer.sendMessage as any).called).to.equal(true);
  //         const msg = (peer.sendMessage as any).args[0][0] as QueryShortChannelIdsMessage;
  //         expect(msg).to.be.instanceOf(QueryShortChannelIdsMessage);
  //         expect(msg.chainHash).to.equal(sut.chainHash);
  //         expect(msg.shortChannelIds.length).to.equal(1);
  //         expect(msg.shortChannelIds[0].block).to.equal(3);
  //       });

  //       it("maintains current state", () => {
  //         const priorState = sut.state;
  //         sut.enqueueShortChannelIds([new ShortChannelId(3, 3, 3)]);
  //         peer.emit("message", createMsg());
  //         expect(sut.state).to.equal(priorState);
  //       });
  //     });

  //     describe("complete=true, hasQueuedShortIds=false", () => {
  //       function createMsg() {
  //         const msg = new ReplyShortChannelIdsEndMessage();
  //         msg.complete = true;
  //         return msg;
  //       }

  //       it("sends gossip_timestamp_filter message", () => {
  //         peer.emit("message", createMsg());
  //         expect((peer.sendMessage as any).called).to.equal(true);
  //         const msg = (peer.sendMessage as any).args[0][0] as GossipTimestampFilterMessage;
  //         expect(msg).to.be.instanceOf(GossipTimestampFilterMessage);
  //         expect(msg.chainHash).to.equal(sut.chainHash);
  //         expect(msg.firstTimestamp).be.gte(Math.trunc(Date.now() / 1000));
  //         expect(msg.timestampRange).to.equal(4294967295);
  //       });

  //       it("transitions to Active state", () => {
  //         peer.emit("message", createMsg());
  //         expect(sut.state).to.be.instanceOf(ActiveState);
  //       });
  //     });
  //   });
  // });
});
