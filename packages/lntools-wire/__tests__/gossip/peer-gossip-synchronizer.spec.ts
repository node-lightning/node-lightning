// tslint:disable: no-unused-expression

import { Logger } from "@lntools/logger";
import { expect } from "chai";
import sinon from "sinon";
import { PeerGossipSynchronizer } from "../../lib/gossip/peer-gossip-synchronizer";
import { PeerGossipQueryState } from "../../lib/gossip/peer-gossip-synchronizer";
import { GossipTimestampFilterMessage } from "../../lib/messages/gossip-timestamp-filter-message";
import { QueryChannelRangeMessage } from "../../lib/messages/query-channel-range-message";
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

  type QueryEventAssertions = {
    onSyncRange_WithDefaults: () => void;
    onSyncRange_WithOptions: () => void;
    onReplyChannelRange_Complete_NoScids: () => void;
    onReplyChannelRange_Complete_Scids: () => void;
    onReplyChannelRange_NotComplete_Scids: () => void;
    onReplyChannelRange_NotComplete_NoScids: () => void;
    onReplyShortChannelIdsEnd_Complete_Scids: () => void;
    onReplyShortChannelIdsEnd_Complete_NoScids: () => void;
    onReplyShortChannelIdsEnd_NotComplete_Scids: () => void;
    onReplyShortChannelIdsEnd_NotComplete_NoScids: () => void;
  };

  function runQueryEvents(assertions: QueryEventAssertions) {
    describe("event: call .syncRange() with defaults", () => {
      beforeEach(() => {
        sut.syncRange();
      });
      assertions.onSyncRange_WithDefaults();
    });

    describe("event: call .syncRange() with options", () => {
      beforeEach(() => {
        sut.syncRange(1000000, 1000);
      });
      assertions.onSyncRange_WithOptions();
    });

    describe("event: receive reply_channel_range complete=true, with_scids=true", () => {
      beforeEach(() => {
        const msg = new ReplyChannelRangeMessage();
        msg.complete = true;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        peer.emit("message", msg);
      });
      assertions.onReplyChannelRange_Complete_Scids();
    });

    describe("event: receive reply_channel_range complete=true, with_scids=false", () => {
      beforeEach(() => {
        const msg = new ReplyChannelRangeMessage();
        msg.complete = true;
        msg.shortChannelIds = [];
        peer.emit("message", msg);
      });
      assertions.onReplyChannelRange_Complete_NoScids();
    });

    describe("event: receive reply_channel_range complete=false, with_scids=true", () => {
      beforeEach(() => {
        const msg = new ReplyChannelRangeMessage();
        msg.complete = false;
        msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        peer.emit("message", msg);
      });
      assertions.onReplyChannelRange_NotComplete_Scids();
    });

    describe("event: receive reply_channel_range complete=false, with_scids=false", () => {
      beforeEach(() => {
        const msg = new ReplyChannelRangeMessage();
        msg.complete = false;
        msg.shortChannelIds = [];
        peer.emit("message", msg);
      });
      assertions.onReplyChannelRange_NotComplete_NoScids();
    });

    describe("event: receive reply_short_channel_ids_end complete=true, with_scids=true", () => {
      beforeEach(() => {
        (sut as any)._queryScidQueue.push(new ShortChannelId(2, 2, 2));
        const msg = new ReplyShortChannelIdsEndMessage();
        msg.complete = true;
        peer.emit("message", msg);
      });
      assertions.onReplyShortChannelIdsEnd_Complete_Scids();
    });

    describe("event: receive reply_short_channel_ids_end complete=true, with_scids=false", () => {
      beforeEach(() => {
        const msg = new ReplyShortChannelIdsEndMessage();
        msg.complete = true;
        peer.emit("message", msg);
      });
      assertions.onReplyShortChannelIdsEnd_Complete_NoScids();
    });

    describe("event: receive reply_short_channel_ids_end complete=false, with_scids=true", () => {
      beforeEach(() => {
        (sut as any)._queryScidQueue.push(new ShortChannelId(2, 2, 2));
        const msg = new ReplyShortChannelIdsEndMessage();
        msg.complete = false;
        peer.emit("message", msg);
      });
      assertions.onReplyShortChannelIdsEnd_NotComplete_Scids();
    });

    describe("event receive reply_short_channel_ids_end complete=false, with_scids=false", () => {
      beforeEach(() => {
        const msg = new ReplyShortChannelIdsEndMessage();
        msg.complete = false;
        peer.emit("message", msg);
      });
      assertions.onReplyShortChannelIdsEnd_NotComplete_NoScids();
    });
  }

  describe("query_state: pending", () => {
    runQueryEvents({
      onSyncRange_WithDefaults: () => {
        it("should send query_channel_range", () => {
          const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
          expect(msg.firstBlocknum).to.equal(0);
          expect(msg.numberOfBlocks).to.equal(4294967295);
        });

        it("should transition to awaiting_ranges", () => {
          sut.syncRange();
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingRanges);
        });
      },

      onSyncRange_WithOptions: () => {
        it("should send query_channel_range", () => {
          const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
          expect(msg.firstBlocknum).to.equal(1000000);
          expect(msg.numberOfBlocks).to.equal(1000);
        });

        it("should transition to awaiting_ranges", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingRanges);
        });
      },

      onReplyChannelRange_Complete_NoScids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });
      },

      onReplyChannelRange_Complete_Scids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });
      },

      onReplyChannelRange_NotComplete_Scids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });
      },

      onReplyChannelRange_NotComplete_NoScids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });
      },

      onReplyShortChannelIdsEnd_Complete_NoScids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });
      },

      onReplyShortChannelIdsEnd_Complete_Scids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });
      },

      onReplyShortChannelIdsEnd_NotComplete_NoScids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });
      },

      onReplyShortChannelIdsEnd_NotComplete_Scids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });
      },
    });
  });

  describe("query_state: awaiting_range", () => {
    let channelRangeFailedEvent;
    beforeEach(() => {
      sut.queryState = PeerGossipQueryState.AwaitingRanges;

      channelRangeFailedEvent = sinon.stub();
      sut.on("channel_range_failed", channelRangeFailedEvent);
    });

    runQueryEvents({
      onSyncRange_WithDefaults: () => {
        // TODO
        it("to be defined");
      },
      onSyncRange_WithOptions: () => {
        it("to be defined");
      },

      onReplyChannelRange_Complete_Scids: () => {
        it("should send query_short_channel_ids", () => {
          const msg = peer.sendMessage.args[0][0] as QueryShortChannelIdsMessage;
          expect(msg.shortChannelIds[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
        });

        it("should transition to await_scids", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingScids);
        });
      },

      onReplyChannelRange_Complete_NoScids: () => {
        it("should not send message", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should transition to pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });
      },

      onReplyChannelRange_NotComplete_Scids: () => {
        it("should send query_short_channel_ids", () => {
          const msg = peer.sendMessage.args[0][0] as QueryShortChannelIdsMessage;
          expect(msg.shortChannelIds[0]).to.deep.equal(new ShortChannelId(1, 1, 1));
        });

        it("should transition to await_scids", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingScids);
        });
      },

      onReplyChannelRange_NotComplete_NoScids: () => {
        it("should not send message", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should transition to pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });

        it("should emit channel_range_failed", () => {
          expect(channelRangeFailedEvent.called).to.be.true;
          const msg = channelRangeFailedEvent.args[0][0];
          expect(msg).to.be.instanceOf(ReplyChannelRangeMessage);
        });
      },

      onReplyShortChannelIdsEnd_Complete_NoScids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in awaiting_ranges", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingRanges);
        });
      },

      onReplyShortChannelIdsEnd_Complete_Scids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in awaiting_ranges", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingRanges);
        });
      },

      onReplyShortChannelIdsEnd_NotComplete_NoScids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in awaiting_ranges", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingRanges);
        });
      },

      onReplyShortChannelIdsEnd_NotComplete_Scids: () => {
        it("should not send anything", () => {
          expect(peer.sendMessage.callCount).to.equal(0);
        });

        it("should stay in awaiting_ranges", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingRanges);
        });
      },
    });
  });

  describe("query_state: awaiting_scids", () => {
    let failedEvent;

    beforeEach(() => {
      sut.queryState = PeerGossipQueryState.AwaitingScids;
      failedEvent = sinon.stub();
      sut.on("query_short_channel_ids_failed", failedEvent);
    });

    runQueryEvents({
      onSyncRange_WithDefaults: () => {
        // TODO
        it("to be defined");
      },

      onSyncRange_WithOptions: () => {
        // TODO
        it("to be defined");
      },

      onReplyChannelRange_Complete_Scids: () => {
        it("should not transition", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingScids);
        });
      },

      onReplyChannelRange_Complete_NoScids: () => {
        it("should not transition", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingScids);
        });
      },

      onReplyChannelRange_NotComplete_Scids: () => {
        it("should not transition", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingScids);
        });
      },

      onReplyChannelRange_NotComplete_NoScids: () => {
        it("should not transition", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingScids);
        });
      },

      onReplyShortChannelIdsEnd_Complete_NoScids: () => {
        it("should transition to pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });
      },

      onReplyShortChannelIdsEnd_Complete_Scids: () => {
        it("should send query_short_channel_ids", () => {
          const msg = peer.sendMessage.args[0][0];
          expect(msg).to.be.instanceOf(QueryShortChannelIdsMessage);
          expect(msg.shortChannelIds).to.deep.equal([new ShortChannelId(2, 2, 2)]);
        });

        it("should stay in awaiting_scids", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingScids);
        });
      },

      onReplyShortChannelIdsEnd_NotComplete_Scids: () => {
        it("should send query_short_channel_ids", () => {
          const msg = peer.sendMessage.args[0][0];
          expect(msg).to.be.instanceOf(QueryShortChannelIdsMessage);
          expect(msg.shortChannelIds).to.deep.equal([new ShortChannelId(2, 2, 2)]);
        });

        it("should stay in awaiting_scids", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.AwaitingScids);
        });
      },

      onReplyShortChannelIdsEnd_NotComplete_NoScids: () => {
        it("should transition to pending", () => {
          expect(sut.queryState).to.equal(PeerGossipQueryState.Pending);
        });

        it("should emit query_short_ids_failed", () => {
          expect(failedEvent.called).to.be.true;
          const msg = failedEvent.args[0][0] as ReplyShortChannelIdsEndMessage;
          expect(msg).to.be.instanceOf(ReplyShortChannelIdsEndMessage);
        });
      },
    });
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

  function scenarioSyncRange() {}
});
