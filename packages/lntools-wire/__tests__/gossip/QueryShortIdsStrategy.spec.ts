// tslint:disable: no-unused-expression

import { ILogger } from "@lntools/logger";
import { expect } from "chai";
import sinon from "sinon";
import { QueryShortIdsStrategy } from "../../lib/gossip/QueryShortIdsStrategy";
import { QueryShortChannelIdsMessage } from "../../lib/messages/QueryShortChannelIdsMessage";
import { ReplyShortChannelIdsEndMessage } from "../../lib/messages/ReplyShortChannelIdsEndMessage";
import { ShortChannelId } from "../../lib/ShortChannelId";
import { createFakeLogger, createFakePeer } from "../_test-utils";

describe("PeerGossipSynchronizer", () => {
    let chainHash: Buffer;
    let sut: QueryShortIdsStrategy;
    let peer: any;
    let logger: ILogger;
    let shortIdsQueryFailedEvent;

    beforeEach(() => {
        chainHash = Buffer.alloc(32, 1);
        peer = createFakePeer();
        logger = createFakeLogger();
        sut = new QueryShortIdsStrategy(chainHash, peer, logger);

        shortIdsQueryFailedEvent = sinon.stub();
        sut.on("query_short_channel_ids_failed", shortIdsQueryFailedEvent);
    });

    describe("event: receive reply_short_channel_ids_end", () => {
        describe("msg_complete=true, queued_scids=false", () => {
            beforeEach(() => {
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = true;
                peer.emit("message", msg);
            });

            it("should not send any message", () => {
                expect(peer.sendMessage.callCount).to.equal(0);
            });
        });

        describe("msg_complete=true, queued_scids=true", () => {
            beforeEach(() => {
                (sut as any)._queue.push(new ShortChannelId(2, 2, 2));
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = true;
                peer.emit("message", msg);
            });

            it("should send query_short_channel_ids", () => {
                const msg = peer.sendMessage.args[0][0];
                expect(msg).to.be.instanceOf(QueryShortChannelIdsMessage);
                expect(msg.shortChannelIds).to.deep.equal([new ShortChannelId(2, 2, 2)]);
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

            it("should emit query_short_ids_failed", () => {
                expect(shortIdsQueryFailedEvent.called).to.be.true;
                const msg = shortIdsQueryFailedEvent.args[0][0] as ReplyShortChannelIdsEndMessage;
                expect(msg).to.be.instanceOf(ReplyShortChannelIdsEndMessage);
            });
        });

        describe("msg_complete=false, queued_scids=true", () => {
            beforeEach(() => {
                (sut as any)._queue.push(new ShortChannelId(2, 2, 2));
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = false;
                peer.emit("message", msg);
            });

            it("should emit query_short_ids_failed", () => {
                expect(shortIdsQueryFailedEvent.called).to.be.true;
                const msg = shortIdsQueryFailedEvent.args[0][0] as ReplyShortChannelIdsEndMessage;
                expect(msg).to.be.instanceOf(ReplyShortChannelIdsEndMessage);
            });

            it("should send query_short_channel_ids", () => {
                const msg = peer.sendMessage.args[0][0];
                expect(msg).to.be.instanceOf(QueryShortChannelIdsMessage);
                expect(msg.shortChannelIds).to.deep.equal([new ShortChannelId(2, 2, 2)]);
            });
        });
    });
});
