// tslint:disable: no-unused-expression

import { ShortChannelId } from "@node-lightning/core";
import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import sinon from "sinon";
import { ChannelsQuery, ChannelsQueryState } from "../../lib/gossip/ChannelsQuery";
import { QueryShortChannelIdsMessage } from "../../lib/messages/QueryShortChannelIdsMessage";
import { ReplyShortChannelIdsEndMessage } from "../../lib/messages/ReplyShortChannelIdsEndMessage";
import { createFakeLogger, createFakePeer } from "../_test-utils";

describe("ChannelsQuery", () => {
    let chainHash: Buffer;
    let sut: ChannelsQuery;
    let peer: any;
    let logger: ILogger;
    let promise: Promise<void>;

    beforeEach(() => {
        chainHash = Buffer.alloc(32, 1);
        peer = createFakePeer();
        logger = createFakeLogger();
        sut = new ChannelsQuery(chainHash, peer, logger);
    });

    describe("event: receive reply_short_channel_ids_end", () => {
        beforeEach(() => {
            // mock that we sent a message
            (sut as any)._state = ChannelsQueryState.Active;
        });

        describe("msg_complete=true, queued_scids=false", () => {
            beforeEach(() => {
                promise = sut.query(new ShortChannelId(1, 1, 1));
                peer.sendMessage.reset();
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

            it("should resolve", async () => {
                await promise;
            });
        });

        describe("msg_complete=true, queued_scids=true", () => {
            beforeEach(() => {
                promise = sut.query(new ShortChannelId(1, 1, 1));
                peer.sendMessage.reset();
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
        });

        describe("msg_complete=false, queued_scids=false", () => {
            beforeEach(() => {
                promise = sut.query(new ShortChannelId(1, 1, 1));
                peer.sendMessage.reset();
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = false;
                peer.emit("message", msg);
            });

            it("should not send any message", () => {
                promise.catch(() => {
                    expect(peer.sendMessage.callCount).to.equal(0);
                });
            });

            it("should be in failed state", () => {
                promise.catch(() => {
                    expect(sut.state).to.equal(ChannelsQueryState.Failed);
                });
            });

            it("should reject", done => {
                promise.catch(() => done());
            });
        });

        describe("msg_complete=false, queued_scids=true", () => {
            beforeEach(() => {
                promise = sut.query(new ShortChannelId(1, 1, 1));
                peer.sendMessage.reset();
                (sut as any)._queue.push(new ShortChannelId(2, 2, 2));
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = false;
                peer.emit("message", msg);
            });

            it("should not send any message", () => {
                promise.catch(() => {
                    expect(peer.sendMessage.callCount).to.equal(0);
                });
            });

            it("should be in failed state", () => {
                promise.catch(() => {
                    expect(sut.state).to.equal(ChannelsQueryState.Failed);
                });
            });

            it("should reject", done => {
                promise.catch(() => done());
            });
        });

        describe("msg_complete=false, status!=Active", () => {
            it("not cause a failure", done => {
                promise = sut.query(new ShortChannelId(1, 1, 1));
                peer.sendMessage.reset();
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = false;
                peer.emit("message", msg);
                peer.emit("message", msg);
                promise.catch(() => done());
            });
        });

        describe("msg_complete=true, status!=Active", () => {
            it("not cause a failure", async () => {
                promise = sut.query(new ShortChannelId(1, 1, 1));
                peer.sendMessage.reset();
                const msg = new ReplyShortChannelIdsEndMessage();
                msg.complete = true;
                peer.emit("message", msg);
                peer.emit("message", msg);
                await promise;
            });
        });
    });
});
