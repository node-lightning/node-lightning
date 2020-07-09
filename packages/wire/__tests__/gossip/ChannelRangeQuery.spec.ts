// tslint:disable: no-unused-expression
// tslint:disable: no-floating-promises

import { ILogger } from "@lntools/logger";
import { expect } from "chai";
import { ChannelRangeQuery, ChannelRangeQueryState } from "../../lib/gossip/ChannelRangeQuery";
import { QueryChannelRangeMessage } from "../../lib/messages/QueryChannelRangeMessage";
import { ReplyChannelRangeMessage } from "../../lib/messages/ReplyChannelRangeMessage";
import { ShortChannelId } from "../../lib/ShortChannelId";
import { createFakeLogger, createFakePeer } from "../_test-utils";

describe("ChannelRangeQuery", () => {
    let chainHash: Buffer;
    let sut: ChannelRangeQuery;
    let peer: any;
    let logger: ILogger;

    beforeEach(() => {
        chainHash = Buffer.alloc(32, 1);
        peer = createFakePeer();
        logger = createFakeLogger();
        sut = new ChannelRangeQuery(chainHash, peer, logger);
    });

    describe(".queryRange()", () => {
        let promise: Promise<ShortChannelId[]>;

        describe("with defaults", async () => {
            it("should send query_channel_range", () => {
                promise = sut.queryRange();
                const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
                expect(msg.firstBlocknum).to.equal(0);
                expect(msg.numberOfBlocks).to.equal(4294967295);
            });

            it("should be in active state", () => {
                promise = sut.queryRange();
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });
        });

        describe("with options", () => {
            it("should send query_channel_range", () => {
                promise = sut.queryRange(1000000, 1000);
                const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
                expect(msg.firstBlocknum).to.equal(1000000);
                expect(msg.numberOfBlocks).to.equal(1000);
            });

            it("should be in active state", () => {
                promise = sut.queryRange(1000000, 1000);
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });
        });

        describe("with overflow", () => {
            it("should send query_channel_range", () => {
                promise = sut.queryRange(1000);
                const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
                expect(msg.firstBlocknum).to.equal(1000);
                expect(msg.numberOfBlocks).to.equal(4294966295);
            });

            it("should be in active state", () => {
                promise = sut.queryRange(1000);
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });
        });
    });

    describe("error reply", () => {
        let promise: Promise<ShortChannelId[]>;

        beforeEach(() => {
            promise = sut.queryRange(0, 1000);

            const msg = new ReplyChannelRangeMessage();
            msg.fullInformation = false;
            msg.firstBlocknum = 0;
            msg.numberOfBlocks = 1000;
            peer.emit("message", msg);
        });

        it("should reject with error", done => {
            promise.catch(() => done());
        });

        it("transitions to failed", () => {
            promise.catch(() => {
                expect(sut.state).to.equal(ChannelRangeQueryState.Failed);
            });
        });
    });

    describe("single reply", () => {
        let promise: Promise<ShortChannelId[]>;

        beforeEach(() => {
            promise = sut.queryRange(0, 1000);

            const msg = new ReplyChannelRangeMessage();
            msg.fullInformation = true;
            msg.firstBlocknum = 0;
            msg.numberOfBlocks = 1000;
            msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
            peer.emit("message", msg);
        });

        it("should returns scids", async () => {
            const scids = await promise;
            expect(scids).to.deep.equal([new ShortChannelId(1, 1, 1)]);
        });

        it("transitions to complete", async () => {
            await promise;
            expect(sut.state).to.equal(ChannelRangeQueryState.Complete);
        });
    });

    describe("multi reply incomplete", () => {
        let promise: Promise<ShortChannelId[]>;

        beforeEach(() => {
            promise = sut.queryRange(0, 1000);

            const msg = new ReplyChannelRangeMessage();
            msg.fullInformation = true;
            msg.firstBlocknum = 0;
            msg.numberOfBlocks = 500;
            msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
            peer.emit("message", msg);
        });

        it("should enqueue scids", () => {
            expect(sut.results).to.deep.equal([new ShortChannelId(1, 1, 1)]);
        });

        it("stays in active state", () => {
            expect(sut.state).to.equal(ChannelRangeQueryState.Active);
        });
    });

    describe("multi reply complete", () => {
        let promise: Promise<ShortChannelId[]>;

        beforeEach(() => {
            promise = sut.queryRange(0, 1000);

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

        it("should enqueue scids", async () => {
            const scids = await promise;
            expect(scids).to.deep.equal([
                new ShortChannelId(1, 1, 1),
                new ShortChannelId(500, 1, 1),
            ]);
        });

        it("state should be complete", async () => {
            await promise;
            expect(sut.state).to.equal(ChannelRangeQueryState.Complete);
        });
    });

    describe("detect legacy", () => {
        let promise: Promise<ShortChannelId[]>;

        describe("full_info=false, with_scids=true", () => {
            beforeEach(() => {
                promise = sut.queryRange(0, 4294967295);
                (sut as any)._isLegacy = true;
                const msg = new ReplyChannelRangeMessage();
                msg.fullInformation = false;
                msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
                msg.firstBlocknum = 0;
                msg.numberOfBlocks = 4294967295;
                peer.emit("message", msg);
            });

            it("should be active", async () => {
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });

            it("should be legacy", async () => {
                expect(sut.isLegacy).to.be.true;
            });
        });
    });

    describe("when isLegacy", () => {
        let promise: Promise<ShortChannelId[]>;

        beforeEach(() => {
            (sut as any)._isLegacy = true;
        });

        describe("full_info=true, with_scids=true", () => {
            beforeEach(() => {
                promise = sut.queryRange(0, 4294967295);
                const msg = new ReplyChannelRangeMessage();
                msg.fullInformation = true;
                msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
                msg.firstBlocknum = 0;
                msg.numberOfBlocks = 4294967295;
                peer.emit("message", msg);
            });

            it("should emit complete", async () => {
                const scids = await promise;
                expect(scids).to.deep.equal([new ShortChannelId(1, 1, 1)]);
            });

            it("should be in complete state", async () => {
                await promise;
                expect(sut.state).to.equal(ChannelRangeQueryState.Complete);
            });
        });

        describe("full_info=true, with_scids=false", () => {
            beforeEach(() => {
                promise = sut.queryRange(0, 4294967295);
                const msg = new ReplyChannelRangeMessage();
                msg.fullInformation = true;
                msg.firstBlocknum = 0;
                msg.numberOfBlocks = 4294967295;
                msg.shortChannelIds = [];
                peer.emit("message", msg);
            });

            it("should error", done => {
                promise.catch(() => done());
            });

            it("should be in failed state", done => {
                promise.catch(() => {
                    expect(sut.state).to.equal(ChannelRangeQueryState.Failed);
                    done();
                });
            });
        });

        describe("full_info=false, with_scids=true", () => {
            beforeEach(() => {
                promise = sut.queryRange(0, 4294967295);
                const msg = new ReplyChannelRangeMessage();
                msg.fullInformation = false;
                msg.firstBlocknum = 0;
                msg.numberOfBlocks = 4294967295;
                msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
                peer.emit("message", msg);
            });

            it("should enqueue results", () => {
                expect(sut.results).to.deep.equal([new ShortChannelId(1, 1, 1)]);
            });

            it("should still be active", () => {
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });
        });
    });
});
