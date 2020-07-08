// tslint:disable: no-unused-expression

import { ILogger } from "@lntools/logger";
import { expect } from "chai";
import sinon from "sinon";
import { IQueryShortIdsStrategy } from "../../lib";
import { ChannelRangeQuery, ChannelRangeQueryState } from "../../lib/gossip/ChannelRangeQuery";
import { IWireMessage } from "../../lib/messages/IWireMessage";
import { QueryChannelRangeMessage } from "../../lib/messages/QueryChannelRangeMessage";
import { ReplyChannelRangeMessage } from "../../lib/messages/ReplyChannelRangeMessage";
import { ShortChannelId } from "../../lib/ShortChannelId";
import { createFakeLogger, createFakePeer } from "../_test-utils";

describe("ChannelRangeQuery", () => {
    let chainHash: Buffer;
    let sut: ChannelRangeQuery;
    let peer: any;
    let logger: ILogger;
    let errorEvent: sinon.SinonStub;
    let completeEvent: sinon.SinonStub;

    beforeEach(() => {
        chainHash = Buffer.alloc(32, 1);
        peer = createFakePeer();
        logger = createFakeLogger();
        sut = new ChannelRangeQuery(chainHash, peer, logger);

        errorEvent = sinon.stub();
        sut.on("error", errorEvent);

        completeEvent = sinon.stub();
        sut.on("complete", completeEvent);
    });

    describe(".queryRange()", () => {
        describe("with defaults", () => {
            beforeEach(() => {
                sut.queryRange();
            });

            it("should send query_channel_range", () => {
                const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
                expect(msg.firstBlocknum).to.equal(0);
                expect(msg.numberOfBlocks).to.equal(4294967295);
            });

            it("should be in active state", () => {
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });
        });

        describe("with options", () => {
            beforeEach(() => {
                sut.queryRange(1000000, 1000);
            });

            it("should send query_channel_range", () => {
                const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
                expect(msg.firstBlocknum).to.equal(1000000);
                expect(msg.numberOfBlocks).to.equal(1000);
            });

            it("should be in active state", () => {
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });
        });

        describe("with overflow", () => {
            beforeEach(() => {
                sut.queryRange(1000);
            });

            it("should send query_channel_range", () => {
                const msg = peer.sendMessage.args[0][0] as QueryChannelRangeMessage;
                expect(msg.firstBlocknum).to.equal(1000);
                expect(msg.numberOfBlocks).to.equal(4294966295);
            });

            it("should be in active state", () => {
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });
        });
    });

    describe("error reply", () => {
        beforeEach(() => {
            sut.queryRange(0, 1000);

            const msg = new ReplyChannelRangeMessage();
            msg.fullInformation = false;
            msg.firstBlocknum = 0;
            msg.numberOfBlocks = 1000;
            peer.emit("message", msg);
        });

        it("should emit error", () => {
            expect(errorEvent.called).to.be.true;
        });

        it("transitions to failed", () => {
            expect(sut.state).to.equal(ChannelRangeQueryState.Failed);
        });
    });

    describe("single reply", () => {
        beforeEach(() => {
            sut.queryRange(0, 1000);

            const msg = new ReplyChannelRangeMessage();
            msg.fullInformation = true;
            msg.firstBlocknum = 0;
            msg.numberOfBlocks = 1000;
            msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
            peer.emit("message", msg);
        });

        it("should returns scids", () => {
            const scids = completeEvent.args[0][0];
            expect(scids).to.deep.equal([new ShortChannelId(1, 1, 1)]);
        });

        it("transitions to complete", () => {
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
        beforeEach(() => {
            sut.queryRange(0, 1000);

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

        it("should enqueue scids", () => {
            const scids = completeEvent.args[0][0];
            expect(scids).to.deep.equal([
                new ShortChannelId(1, 1, 1),
                new ShortChannelId(500, 1, 1),
            ]);
        });

        it("state should be complete", () => {
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
                msg.firstBlocknum = 0;
                msg.numberOfBlocks = 4294967295;
                peer.emit("message", msg);
            });

            it("should be active", () => {
                expect(sut.state).to.equal(ChannelRangeQueryState.Active);
            });

            it("should be legacy", () => {
                expect(sut.isLegacy).to.be.true;
            });
        });
    });

    describe("when isLegacy", () => {
        beforeEach(() => {
            (sut as any)._isLegacy = true;
        });

        describe("full_info=true, with_scids=true", () => {
            beforeEach(() => {
                sut.queryRange(0, 4294967295);
                const msg = new ReplyChannelRangeMessage();
                msg.fullInformation = true;
                msg.shortChannelIds.push(new ShortChannelId(1, 1, 1));
                msg.firstBlocknum = 0;
                msg.numberOfBlocks = 4294967295;
                peer.emit("message", msg);
            });

            it("should emit complete", () => {
                const scids = completeEvent.args[0][0];
                expect(scids).to.deep.equal([new ShortChannelId(1, 1, 1)]);
            });

            it("should be in complete state", () => {
                expect(sut.state).to.equal(ChannelRangeQueryState.Complete);
            });
        });

        describe("full_info=true, with_scids=false", () => {
            beforeEach(() => {
                sut.queryRange(0, 4294967295);
                const msg = new ReplyChannelRangeMessage();
                msg.fullInformation = true;
                msg.firstBlocknum = 0;
                msg.numberOfBlocks = 4294967295;
                msg.shortChannelIds = [];
                peer.emit("message", msg);
            });

            it("should error", () => {
                expect(errorEvent.called).to.be.true;
            });

            it("should be in failed state", () => {
                expect(sut.state).to.equal(ChannelRangeQueryState.Failed);
            });
        });

        describe("full_info=false, with_scids=true", () => {
            beforeEach(() => {
                sut.queryRange(0, 4294967295);
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
