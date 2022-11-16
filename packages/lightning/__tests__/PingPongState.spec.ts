import { expect } from "chai";
import sinon from "sinon";
import { PingPongState } from "../lib/PingPongState";

function createAndStart({ PING_INTERVAL_MS, PONG_TIMEOUT_MS, PING_FLOOD_THRESHOLD }: any) {
    const peerClient = {
        reconnect: sinon.stub(),
        disconnect: sinon.stub(),
        sendMessage: sinon.stub(),
        logger: {
            debug: sinon.stub(),
        },
    };
    const sut = new PingPongState(peerClient as any);
    if (PING_INTERVAL_MS) {
        sut.PING_INTERVAL_MS = PING_INTERVAL_MS;
    }
    if (PONG_TIMEOUT_MS) {
        sut.PONG_TIMEOUT_MS = PONG_TIMEOUT_MS;
    }
    if (PING_FLOOD_THRESHOLD) {
        sut.PING_FLOOD_THRESHOLD = PING_FLOOD_THRESHOLD;
    }
    sut.start();
    return sut;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("pingpong-state", () => {
    let sut;

    afterEach(() => {
        sut.onDisconnecting();
    });

    describe("when ping interval expires", () => {
        describe("when no message has been received", () => {
            it("it should send a ping", async () => {
                sut = createAndStart({ PING_INTERVAL_MS: 10 });
                await wait(15);
                expect(sut._peerClient.sendMessage.args[0][0]).to.deep.equal({
                    type: 18,
                    numPongBytes: 1,
                    ignored: Buffer.alloc(0),
                });
            });
        });
        describe("when last message is old", () => {
            it("it should send a ping", async () => {
                sut = createAndStart({ PING_INTERVAL_MS: 10 });
                await wait(15);
                sut.onMessage({ type: 258 });
                expect(sut._peerClient.sendMessage.args[0][0]).to.deep.equal({
                    type: 18,
                    numPongBytes: 1,
                    ignored: Buffer.alloc(0),
                });
            });
        });
        describe("when message has been received", () => {
            it("it should not send ping", async () => {
                sut = createAndStart({ PING_INTERVAL_MS: 10 });
                await wait(5);
                sut.onMessage({ type: 258 });
                await wait(10);
                expect(sut._peerClient.sendMessage.callCount).to.equal(0);
            });
        });
    });

    describe("when pong expires", () => {
        it("it should reconnect", async () => {
            sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 1 });
            await wait(15);
            expect(sut._peerClient.reconnect.callCount).to.equal(1);
        });
    });

    describe("when pong received", () => {
        it("it should cancel pong timeout", async () => {
            sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 3 });
            await wait(12);
            sut.onMessage({ type: 19, ignored: Buffer.alloc(1) });
            await wait(5);
            expect(sut._peerClient.disconnect.callCount).to.equal(0);
        });
        it("it should be happy if valid pong", async () => {
            sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 3 });
            await wait(12);
            sut.onMessage({ type: 19, ignored: Buffer.alloc(1) });
            expect(sut._peerClient.disconnect.callCount).to.equal(0);
        });
        it("it should disconnect if invalid pong", async () => {
            sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 3 });
            await wait(12);
            sut.onMessage({ type: 19, ignored: Buffer.alloc(2) });
            expect(sut._peerClient.disconnect.callCount).to.equal(1);
        });
    });

    describe("when ping received", () => {
        it("it should not send ping when numPongBytes gte 65532", () => {
            sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 3 });
            sut.onMessage({ type: 18, numPongBytes: 65532 });
            expect(sut._peerClient.disconnect.callCount).to.equal(0);
        });
        it("it should send correct pong", () => {
            sut = createAndStart({ PING_INTERVAL_MS: 10, PONG_TIMEOUT_MS: 3 });
            sut.onMessage({ type: 18, numPongBytes: 1 });
            expect(sut._peerClient.sendMessage.args[0][0]).to.deep.equal({
                type: 19,
                ignored: Buffer.alloc(1),
            });
        });
        it("it should disconnect if ping flood", () => {
            sut = createAndStart({ PING_FLOOD_THRESHOLD: 2 });
            sut.onMessage({ type: 18, numPongBytes: 1 });
            sut.onMessage({ type: 18, numPongBytes: 1 });
            sut.onMessage({ type: 18, numPongBytes: 1 });
            expect(sut._peerClient.disconnect.callCount).to.equal(1);
        });
    });

    describe("normal ping frequency", () => {
        it("should not trigger disconnect", async () => {
            sut = createAndStart({ PING_FLOOD_THRESHOLD: 2, PING_INTERVAL_MS: 10 });
            sut.onMessage({ type: 18, numPongBytes: 1 });
            await wait(10);
            sut.onMessage({ type: 18, numPongBytes: 1 });
            await wait(10);
            sut.onMessage({ type: 18, numPongBytes: 1 });
            await wait(10);
            sut.onMessage({ type: 18, numPongBytes: 1 });
            await wait(10);
            expect(sut._peerClient.disconnect.callCount).to.equal(0);
        });
    });
});
