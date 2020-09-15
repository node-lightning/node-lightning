// tslint:disable: no-unused-expression
import { expect, use } from "chai";
import { GossipRelay } from "../../lib/gossip/GossipRelay";
import { GossipRelayState } from "../../lib/gossip/GossipRelay";
import { ChannelAnnouncementMessage } from "../../lib/messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "../../lib/messages/ChannelUpdateMessage";
import { NodeAnnouncementMessage } from "../../lib/messages/NodeAnnouncementMessage";
import { ShortChannelId } from "../../lib/ShortChannelId";
import { createFakePeer, wait } from "../_test-utils";

describe("GossipRelay", () => {
    let sut: GossipRelay;

    function createChanAnn(block: number, tx: number, output: number): ChannelAnnouncementMessage {
        const msg = new ChannelAnnouncementMessage();
        msg.shortChannelId = new ShortChannelId(block, tx, output);
        return msg;
    }

    function createChanUpd(
        block: number,
        tx: number,
        output: number,
        timestamp: number,
    ): ChannelUpdateMessage {
        const msg = new ChannelUpdateMessage();
        msg.shortChannelId = new ShortChannelId(block, tx, output);
        msg.timestamp = timestamp;
        return msg;
    }

    function createNodeAnn(nodeIdHex: string, timestamp: number): NodeAnnouncementMessage {
        const msg = new NodeAnnouncementMessage();
        msg.nodeId = Buffer.from(nodeIdHex, "hex");
        msg.timestamp = timestamp;
        return msg;
    }

    beforeEach(() => {
        sut = new GossipRelay(100, 3);
    });

    describe("state: Inactive", () => {
        describe("on .start()", () => {
            beforeEach(() => {
                sut.start();
            });

            afterEach(() => {
                sut.stop();
            });

            it("starts periodic flushing", async () => {
                const peer1 = createFakePeer();
                sut.addPeer(peer1);

                const msg1 = createChanAnn(0, 0, 0);
                sut.enqueue(msg1);

                await wait(200);

                expect(peer1.sendMessage.called).to.be.true;
                expect(peer1.sendMessage.args[0][0]).to.equal(msg1);
            });
            it("transitions state to Active", () => {
                sut.start();
                expect(sut.state).to.equal(GossipRelayState.Active);
            });
        });

        describe("on .stop()", () => {
            it("no-op", () => {
                sut.stop();
            });
        });

        describe("on enqueue", () => {
            it("ignores message", () => {
                sut.enqueue(createChanAnn(0, 0, 0));
                expect((sut as any)._queue.length).to.equal(0);
            });
        });
    });

    describe("state: Active", () => {
        beforeEach(() => {
            sut.start();
        });

        afterEach(() => {
            sut.stop();
        });

        describe("on .start()", () => {
            it("no-op", () => {
                sut.start();
            });
        });

        describe("on .stop()", () => {
            it("stops flushing", async () => {
                // create a peer
                const peer1 = createFakePeer();
                sut.addPeer(peer1);

                // enqueue a message that normally would go to a peer
                const msg1 = createChanAnn(0, 0, 0);
                sut.enqueue(msg1);

                // stop activity before the timer would tick
                await wait(50);
                sut.stop();

                // wait until after the timer would normally have ticked
                await wait(200);

                // ensure no message was sent
                expect(peer1.sendMessage.called).to.be.false;
            });

            it("changes state to Inactive", () => {
                expect(sut.state).to.equal(GossipRelayState.Active);
                sut.stop();
                expect(sut.state).to.equal(GossipRelayState.Inactive);
            });
        });

        describe("on enqueue", () => {
            describe("channel_announcement", () => {
                it("adds new message", () => {
                    sut.enqueue(createChanAnn(0, 0, 0));
                    expect((sut as any)._queue.length).to.equal(1);
                });

                it("ignores duplicate", () => {
                    sut.enqueue(createChanAnn(0, 0, 0));
                    sut.enqueue(createChanAnn(0, 1, 0));
                    expect((sut as any)._queue.length).to.equal(2);

                    sut.enqueue(createChanAnn(0, 0, 0));
                    expect((sut as any)._queue.length).to.equal(2, "should ignore duplicate");
                    expect((sut as any)._queue[0].shortChannelId.txIdx).to.equal(0, "duplicate should maintain original position"); // prettier-ignore
                });
            });

            describe("channel_update", () => {
                it("adds new message", () => {
                    sut.enqueue(createChanUpd(0, 0, 0, 0));
                    expect((sut as any)._queue.length).to.equal(1);
                });

                it("ignores duplicate", () => {
                    sut.enqueue(createChanUpd(0, 0, 0, 0));
                    sut.enqueue(createChanUpd(0, 1, 0, 0));
                    expect((sut as any)._queue.length).to.equal(2);

                    sut.enqueue(createChanUpd(0, 0, 0, 0));
                    expect((sut as any)._queue.length).to.equal(2, "should ignore update");
                    expect((sut as any)._queue[0].shortChannelId.txIdx).to.equal(0, "duplicate should maintain original position"); // prettier-ignore
                });

                it("replaces outdated", () => {
                    sut.enqueue(createChanUpd(0, 0, 0, 0));
                    sut.enqueue(createChanUpd(1, 0, 0, 0));
                    expect((sut as any)._queue.length).to.equal(2);

                    sut.enqueue(createChanUpd(0, 0, 0, 1));
                    expect((sut as any)._queue[0].shortChannelId.block).to.equal(1);
                    expect((sut as any)._queue[1].shortChannelId.block).to.equal(0);
                });
            });

            describe("node_announcement", () => {
                it("adds new message", () => {
                    sut.enqueue(createNodeAnn("00".repeat(32), 0));
                    expect((sut as any)._queue.length).to.equal(1);
                });

                it("ignores duplicate", () => {
                    sut.enqueue(createNodeAnn("00".repeat(32), 0));
                    sut.enqueue(createNodeAnn("01".repeat(32), 0));
                    expect((sut as any)._queue.length).to.equal(2);

                    sut.enqueue(createNodeAnn("00".repeat(32), 0));
                    expect((sut as any)._queue[0].nodeId.toString("hex")).to.equal("00".repeat(32));
                    expect((sut as any)._queue[1].nodeId.toString("hex")).to.equal("01".repeat(32));
                });

                it("replaces outdated", () => {
                    sut.enqueue(createNodeAnn("00".repeat(32), 0));
                    sut.enqueue(createNodeAnn("01".repeat(32), 0));
                    expect((sut as any)._queue.length).to.equal(2);

                    sut.enqueue(createNodeAnn("00".repeat(32), 1));
                    expect((sut as any)._queue[0].nodeId.toString("hex")).to.equal("01".repeat(32));
                    expect((sut as any)._queue[1].nodeId.toString("hex")).to.equal("00".repeat(32));
                    expect((sut as any)._queue[1].timestamp).to.equal(1);
                });
            });
        });

        describe("on timer", () => {
            it("flushes to single message peer", () => {
                // create a fake peer and add
                const peer1 = createFakePeer();
                sut.addPeer(peer1);

                // push a new message
                const msg1 = createChanAnn(0, 0, 0);
                sut.enqueue(msg1);

                // manually trigger the timer for testing purposes
                (sut as any)._onTimer();

                expect(peer1.sendMessage.called).to.be.true;
                expect(peer1.sendMessage.args[0][0]).to.equal(msg1);
            });

            it("flushes to several messages peer", () => {
                // create a fake peer and add
                const peer1 = createFakePeer();
                sut.addPeer(peer1);

                // push messages
                const msg1 = createChanAnn(0, 0, 0);
                const msg2 = createChanAnn(1, 0, 0);
                sut.enqueue(msg1);
                sut.enqueue(msg2);

                // manually trigger the timer for testing purposes
                (sut as any)._onTimer();

                expect(peer1.sendMessage.called).to.be.true;
                expect(peer1.sendMessage.args[0][0]).to.equal(msg1);
                expect(peer1.sendMessage.args[1][0]).to.equal(msg2);
            });

            it("flushes new messages to peer", () => {
                // create a fake peer and add
                const peer1 = createFakePeer();
                sut.addPeer(peer1);

                // push messages
                const msg1 = createChanAnn(0, 0, 0);
                sut.enqueue(msg1);

                // manually trigger the timer for testing purposes
                (sut as any)._onTimer();

                // reset the stub
                peer1.sendMessage.reset();

                // push new message
                const msg2 = createChanAnn(1, 0, 0);
                sut.enqueue(msg2);

                // manually trigger the timer for testing purposes
                (sut as any)._onTimer();

                expect(peer1.sendMessage.called).to.be.true;
                expect(peer1.sendMessage.args[0][0]).to.equal(msg2);
            });

            it("flushes new messages to peers", () => {
                // create a fake peer and add
                const peer1 = createFakePeer();
                sut.addPeer(peer1);

                // push messages
                const msg1 = createChanAnn(0, 0, 0);
                sut.enqueue(msg1);

                // manually trigger the timer for testing purposes
                (sut as any)._onTimer();

                // reset the stub
                peer1.sendMessage.reset();

                // add a new peer
                const peer2 = createFakePeer();
                sut.addPeer(peer2);

                // push new message
                const msg2 = createChanAnn(1, 0, 0);
                sut.enqueue(msg2);

                // manually trigger the timer for testing purposes
                (sut as any)._onTimer();

                // peer1 should only see the 2nd message
                expect(peer1.sendMessage.called).to.be.true;
                expect(peer1.sendMessage.args[0][0]).to.equal(msg2);

                // peer2 should only see the 2nd message
                expect(peer2.sendMessage.called).to.be.true;
                expect(peer2.sendMessage.args[0][0]).to.equal(msg2);
            });

            it("prunes excess messages", () => {
                sut.enqueue(createChanAnn(0, 0, 0));
                sut.enqueue(createChanAnn(1, 0, 0));
                sut.enqueue(createChanAnn(2, 0, 0));
                sut.enqueue(createChanAnn(3, 0, 0));
                sut.enqueue(createChanAnn(4, 0, 0));

                // manually trigger the timer for testing purposes
                (sut as any)._onTimer();

                expect((sut as any)._queue.length).to.equal(3);
                expect((sut as any)._queue[0].shortChannelId.block).to.equal(2);
            });

            it("it adjusts peer positions based on index count", () => {
                // create a fake peer and add
                const peer1 = createFakePeer();
                sut.addPeer(peer1);

                // enqueue some items - peer is at index 0
                sut.enqueue(createChanAnn(0, 0, 0)); // index 0
                sut.enqueue(createChanAnn(1, 0, 0)); // index 1
                sut.enqueue(createChanAnn(2, 0, 0)); // index 2

                // manually trigger the timer for testing purposes
                (sut as any)._onTimer();

                // enqueue more items - peer is at index 3
                sut.enqueue(createChanAnn(3, 0, 0)); // index 3
                sut.enqueue(createChanAnn(4, 0, 0)); // index 4

                // manually trigger the timer for testing purposes which
                // will cause a prune of and leave 3 items in the queue
                (sut as any)._onTimer();

                expect((sut as any)._peers.get(peer1)).to.equal(3);
            });
        });
    });

    describe("add peer", () => {
        it("adds peer at current depth", () => {
            // create a fake peer and add
            const peer1 = createFakePeer();
            sut.addPeer(peer1);
            expect((sut as any)._peers.size).to.equal(1);
        });
    });

    describe("remove peer", () => {
        it("removes peer from list", () => {
            // create a fake peer and add
            const peer1 = createFakePeer();
            sut.addPeer(peer1);
            sut.removePeer(peer1);
            expect((sut as any)._peers.size).to.equal(0);
        });
    });
});
