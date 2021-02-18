/* eslint-disable @typescript-eslint/no-explicit-any */
import { ShortChannelId } from "@node-lightning/core";
import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import { GossipError, GossipErrorCode } from "../../lib/gossip/GossipError";
import { GossipQueriesSync, GossipQueriesSyncState } from "../../lib/gossip/GossipQueriesSync";
import { ReplyChannelRangeMessage } from "../../lib/messages/ReplyChannelRangeMessage";
import { ReplyShortChannelIdsEndMessage } from "../../lib/messages/ReplyShortChannelIdsEndMessage";
import { createFakeLogger, createFakePeer, wait } from "../_test-utils";

describe("GossipQueriesSync", () => {
    let chainHash: Buffer;
    let sut: GossipQueriesSync;
    let peer: any;
    let logger: ILogger;

    beforeEach(() => {
        chainHash = Buffer.alloc(32);
        peer = createFakePeer();
        logger = createFakeLogger();
        sut = new GossipQueriesSync(chainHash, peer, logger);
    });

    it("integration - success", async () => {
        // change the default completion timeout to 50ms
        (sut as any)._syncWatcher.completeAfterMs = 50;

        // we should expect to start in the idel posion since we have not yet
        // execute the query
        expect(sut.state).to.equal(GossipQueriesSyncState.Idle);

        // Execute the query. Since this is a promise, we will resolve the test
        // when the queryRange method resolves successfully. If for some reason
        // it fails, we will reject with the error and the test will fail
        const promise = sut.queryRange();

        // At this point, the query should have been sent and we will now be
        // awaiting completion of the channel range state machine.
        expect(sut.state).to.equal(GossipQueriesSyncState.AwaitingChannelRange);

        // At this point, we should have sent a query message and we will
        // reply from the peer with a response message.
        const replyRangeMsg = new ReplyChannelRangeMessage();
        replyRangeMsg.fullInformation = true;
        replyRangeMsg.firstBlocknum = 0;
        replyRangeMsg.numberOfBlocks = 0xffffffff;
        replyRangeMsg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        sut.handleWireMessage(replyRangeMsg);
        await wait(0); // wait for promise to tick

        // After the reply, we will validate that the
        expect(sut.state).to.equal(GossipQueriesSyncState.AwaitingChannels);

        // At this point, we have sent along our channels query and are waiting
        // for the channels query result along with
        const replyChannelsMsg = new ReplyShortChannelIdsEndMessage();
        replyChannelsMsg.complete = true;
        sut.handleWireMessage(replyChannelsMsg);
        await wait(0); // wait for promise to tick

        // After this reply, we are just waiting for the final messages to
        // arrive
        expect(sut.state).to.equal(GossipQueriesSyncState.AwaitingMessages);

        // now we just need to wait for things to finalize and we will double
        // the completion timeout
        await wait(100);

        // finally the promise should be resolve or rejected at this
        await promise;
    });

    it("integration - rejects on range failure", async () => {
        // we should expect to start in the idel posion since we have not yet
        // execute the query
        expect(sut.state).to.equal(GossipQueriesSyncState.Idle);

        // Execute the query. Since this is a promise, we will resolve the test
        // when the queryRange method resolves successfully. If for some reason
        // it fails, we will reject with the error and the test will fail
        const promise = sut.queryRange();

        // At this point, the query should have been sent and we will now be
        // awaiting completion of the channel range state machine.
        expect(sut.state).to.equal(GossipQueriesSyncState.AwaitingChannelRange);

        // At this point, we should have sent a query message and we will
        // reply from the peer with a response message.
        const replyRangeMsg = new ReplyChannelRangeMessage();
        replyRangeMsg.fullInformation = false;
        replyRangeMsg.firstBlocknum = 0;
        replyRangeMsg.numberOfBlocks = 0xffffffff;
        sut.handleWireMessage(replyRangeMsg);

        // Wait for the promise to fail
        return promise.catch((err: GossipError) => {
            // The state should now be failed
            expect(sut.state).to.equal(GossipQueriesSyncState.Failed);

            // The error should be a RangeQuery failure
            expect(err.code).to.equal(GossipErrorCode.ReplyChannelRangeNoInformation);
        });
    });

    it("integration - rejects on channels failure", async () => {
        // we should expect to start in the idel posion since we have not yet
        // execute the query
        expect(sut.state).to.equal(GossipQueriesSyncState.Idle);

        // Execute the query. Since this is a promise, we will resolve the test
        // when the queryRange method resolves successfully. If for some reason
        // it fails, we will reject with the error and the test will fail
        const promise = sut.queryRange();

        // At this point, the query should have been sent and we will now be
        // awaiting completion of the channel range state machine.
        expect(sut.state).to.equal(GossipQueriesSyncState.AwaitingChannelRange);

        // At this point, we should have sent a query message and we will
        // reply from the peer with a response message.
        const replyRangeMsg = new ReplyChannelRangeMessage();
        replyRangeMsg.fullInformation = true;
        replyRangeMsg.firstBlocknum = 0;
        replyRangeMsg.numberOfBlocks = 0xffffffff;
        replyRangeMsg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
        sut.handleWireMessage(replyRangeMsg);
        await wait(0); // wait for promise to tick

        // After the reply, we will validate that the
        expect(sut.state).to.equal(GossipQueriesSyncState.AwaitingChannels);

        // At this point, we have sent along our channels query and are waiting
        // for the channels query result along with
        const replyChannelsMsg = new ReplyShortChannelIdsEndMessage();
        replyChannelsMsg.complete = false;
        sut.handleWireMessage(replyChannelsMsg);

        // Wait for the promise to fail
        return promise.catch((err: GossipError) => {
            // The state should now be failed
            expect(sut.state).to.equal(GossipQueriesSyncState.Failed);

            // The error should be a RangeQuery failure
            expect(err.code).to.equal(GossipErrorCode.ReplyChannelsNoInfo);
        });
    });
});
