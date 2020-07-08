// tslint:disable: no-unused-expression

import { ILogger } from "@lntools/logger";
import { expect } from "chai";
import sinon from "sinon";
import { ChannelsQuery, ChannelsQueryState } from "../../lib/gossip/ChannelsQuery";
import { QueryShortChannelIdsMessage } from "../../lib/messages/QueryShortChannelIdsMessage";
import { ReplyShortChannelIdsEndMessage } from "../../lib/messages/ReplyShortChannelIdsEndMessage";
import { ShortChannelId } from "../../lib/ShortChannelId";
import { createFakeLogger, createFakePeer } from "../_test-utils";

describe("ChannelsQuery", () => {
    let chainHash: Buffer;
    let sut: ChannelsQuery;
    let peer: any;
    let logger: ILogger;
    let errorEvent: sinon.SinonStub;
    let completeEvent: sinon.SinonStub;

    beforeEach(() => {
        chainHash = Buffer.alloc(32, 1);
        peer = createFakePeer();
        logger = createFakeLogger();
        sut = new ChannelsQuery(chainHash, peer, logger);

        errorEvent = sinon.stub();
        sut.on("error", errorEvent);

        completeEvent = sinon.stub();
        sut.on("complete", completeEvent);
    });

    describe("event: receive reply_short_channel_ids_end", () => {
        beforeEach(() => {
            // mock that we sent a message
            (sut as any)._state = ChannelsQueryState.Active;
        });

        describe("msg_complete=true, queued_scids=false", () => {
            beforeEach(() => {
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = true;
                peer.emit("message", msg);
            });

            it("should not send any message", () => {
                expect(peer.sendMessage.callCount).to.equal(0);
            });

            it("should be in complete state", () => {
                expect(sut.state).to.equal(ChannelsQueryState.Complete);
            });

            it("should emit complete", () => {
                expect(completeEvent.called).to.be.true;
            });

            it("should not emit error", () => {
                expect(errorEvent.called).to.be.false;
            });
        });

        describe("msg_complete=true, queued_scids=true", () => {
            beforeEach(() => {
                (sut as any)._queue.push(new ShortChannelId(2, 2, 2));
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = true;
                peer.emit("message", msg);
            });

            it("should send next query batch", () => {
                const msg = peer.sendMessage.args[0][0];
                expect(msg).to.be.instanceOf(QueryShortChannelIdsMessage);
                expect(msg.shortChannelIds).to.deep.equal([new ShortChannelId(2, 2, 2)]);
            });

            it("should be in active state", () => {
                expect(sut.state).to.equal(ChannelsQueryState.Active);
            });

            it("should not emit complete", () => {
                expect(completeEvent.called).to.be.false;
            });

            it("should not emit error", () => {
                expect(errorEvent.called).to.be.false;
            });
        });

        describe("msg_complete=false, queued_scids=false", () => {
            beforeEach(() => {
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = false;
                peer.emit("message", msg);
            });

            it("should not send any message", () => {
                expect(peer.sendMessage.callCount).to.equal(0);
            });

            it("should be in failed state", () => {
                expect(sut.state).to.equal(ChannelsQueryState.Failed);
            });

            it("should not emit complete", () => {
                expect(completeEvent.called).to.be.false;
            });

            it("should emit error", () => {
                expect(errorEvent.called).to.be.true;
            });
        });

        describe("msg_complete=false, queued_scids=true", () => {
            beforeEach(() => {
                (sut as any)._queue.push(new ShortChannelId(2, 2, 2));
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = false;
                peer.emit("message", msg);
            });

            it("should not send any message", () => {
                expect(peer.sendMessage.callCount).to.equal(0);
            });

            it("should be in failed state", () => {
                expect(sut.state).to.equal(ChannelsQueryState.Failed);
            });

            it("should not emit complete", () => {
                expect(completeEvent.called).to.be.false;
            });

            it("should emit error", () => {
                expect(errorEvent.called).to.be.true;
            });
        });
    });
});
