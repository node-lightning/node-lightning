import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import { GossipSyncWatcher } from "../../lib/gossip/GossipSyncWatcher";
import { createFakeLogger, createFakePeer, wait } from "../_test-utils";

describe("GossipSyncWatcher", () => {
    let peer: any;
    let logger: ILogger;
    let sut: GossipSyncWatcher;
    let promise: Promise<void>;

    beforeEach(() => {
        peer = createFakePeer();
        logger = createFakeLogger();
        sut = new GossipSyncWatcher(peer, logger);
        sut.completeAfterMs = 50;
    });

    it("resolves after gossip inactivity", async () => {
        await sut.watch();
    });

    it("stays active", done => {
        promise = sut.watch();
        Promise.resolve()
            .then(() => wait(25))
            .then(() => peer.emit("message"))
            .then(() => wait(25))
            .then(() => peer.emit("message"))
            .then(() => wait(25))
            .then(() => peer.emit("message"))
            .then(() => wait(25))
            .then(() => peer.emit("message"))
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
});
