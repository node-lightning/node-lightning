/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable mocha/no-async-describe */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */

import { ShortChannelId } from "../../../lib/domain/ShortChannelId";
import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import {
    ChannelRangeQuery,
    ChannelRangeQueryState,
} from "../../../lib/gossip/queries/ChannelRangeQuery";
import { QueryChannelRangeMessage } from "../../../lib/messages/QueryChannelRangeMessage";
import { ReplyChannelRangeMessage } from "../../../lib/messages/ReplyChannelRangeMessage";
import { createFakeLogger, createFakePeer } from "../../_test-utils";

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
        describe("with defaults", async () => {
            it("should send query_channel_range", () => {
                sut.queryRange();
                const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
                expect(msg.firstBlocknum).to.equal(0);
                expect(msg.numberOfBlocks).to.equal(4294967295);
            });

            it("should be in active state", () => {
                sut.queryRange();
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });
        });

        describe("with options", () => {
            it("should send query_channel_range", () => {
                sut.queryRange(1000000, 1000);
                const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
                expect(msg.firstBlocknum).to.equal(1000000);
                expect(msg.numberOfBlocks).to.equal(1000);
            });

            it("should be in active state", () => {
                sut.queryRange(1000000, 1000);
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });
        });

        describe("with overflow", () => {
            it("should send query_channel_range", () => {
                sut.queryRange(1000);
                const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
                expect(msg.firstBlocknum).to.equal(1000);
                expect(msg.numberOfBlocks).to.equal(4294966295);
            });

            it("should be in active state", () => {
                sut.queryRange(1000);
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

            sut.handleReplyChannelRange(msg);
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

    describe("multiple errors", () => {
        it("should reject with single error", done => {
            const promise = sut.queryRange(0, 1000);

            const msg = new ReplyChannelRangeMessage();
            msg.fullInformation = false;
            msg.firstBlocknum = 0;
            msg.numberOfBlocks = 1000;
            sut.handleReplyChannelRange(msg);
            sut.handleReplyChannelRange(msg);
            promise.catch(() => done());
        });
    });

    describe("multiple success", () => {
        it("should resolve with single success", async () => {
            const promise = sut.queryRange(0, 1000);

            const msg = new ReplyChannelRangeMessage();
            msg.fullInformation = true;
            msg.firstBlocknum = 0;
            msg.numberOfBlocks = 1000;
            msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
            sut.handleReplyChannelRange(msg);
            sut.handleReplyChannelRange(msg);

            await promise;
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
            sut.handleReplyChannelRange(msg);
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
        beforeEach(() => {
            sut.queryRange(0, 1000);

            const msg = new ReplyChannelRangeMessage();
            msg.fullInformation = true;
            msg.firstBlocknum = 0;
            msg.numberOfBlocks = 500;
            msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
            sut.handleReplyChannelRange(msg);
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
            sut.handleReplyChannelRange(msg);

            const msg2 = new ReplyChannelRangeMessage();
            msg2.fullInformation = true;
            msg2.firstBlocknum = 500;
            msg2.numberOfBlocks = 500;
            msg2.shortChannelIds.push(new ShortChannelId(500, 1, 1));
            sut.handleReplyChannelRange(msg2);
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
        describe("full_info=false, with_scids=true", () => {
            beforeEach(() => {
                sut.queryRange(0, 4294967295);
                (sut as any)._isLegacy = true;
                const msg = new ReplyChannelRangeMessage();
                msg.fullInformation = false;
                msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
                msg.firstBlocknum = 1000;
                msg.numberOfBlocks = 8000;
                sut.handleReplyChannelRange(msg);
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
                msg.firstBlocknum = 1000;
                msg.numberOfBlocks = 8000;
                sut.handleReplyChannelRange(msg);
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
                msg.firstBlocknum = 1000;
                msg.numberOfBlocks = 8000;
                msg.shortChannelIds = [];
                sut.handleReplyChannelRange(msg);
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
                msg.firstBlocknum = 1000;
                msg.numberOfBlocks = 8000;
                msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
                sut.handleReplyChannelRange(msg);
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
