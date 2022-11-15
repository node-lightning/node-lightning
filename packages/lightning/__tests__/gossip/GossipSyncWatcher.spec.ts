import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import { GossipSyncWatcher, GossipSyncWatcherState } from "../../lib/gossip/GossipSyncWatcher";
import { ChannelAnnouncementMessage } from "../../lib/messages/ChannelAnnouncementMessage";
import { createFakeLogger, wait } from "../_test-utils";

describe("GossipSyncWatcher", () => {
    let logger: ILogger;
    let sut: GossipSyncWatcher;
    let promise: Promise<void>;

    beforeEach(() => {
        logger = createFakeLogger();
        sut = new GossipSyncWatcher(logger);
        sut.completeAfterMs = 50;
    });

    it("resolves after gossip inactivity", async () => {
        await sut.watch();
    });

    it("stays active", done => {
        promise = sut.watch();
        Promise.resolve()
            .then(() => wait(25))
            .then(() => sut.onGossipMessage(new ChannelAnnouncementMessage()))
            .then(() => wait(25))
            .then(() => sut.onGossipMessage(new ChannelAnnouncementMessage()))
            .then(() => wait(25))
            .then(() => sut.onGossipMessage(new ChannelAnnouncementMessage()))
            .then(() => wait(25))
            .then(() => sut.onGossipMessage(new ChannelAnnouncementMessage()))
            .then(() => wait(200))
            .then(() => promise)
            .then(() => {
                expect(sut.messageCounter).to.equal(4);
                done();
            })
            .catch(done);
    });

    it("cancels immediately", async () => {
        sut.completeAfterMs = 5000;
        promise = sut.watch();
        sut.cancel();
        await promise;
    });

    it("doesn't reset timer unless it has started", () => {
        sut.onGossipMessage(new ChannelAnnouncementMessage());
        expect((sut as any)._timeoutHandle).to.be.undefined;
    });

    it("cancels if not started", () => {
        sut.cancel();
        expect(sut.state === GossipSyncWatcherState.Canceled);
    });
});
