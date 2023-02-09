/* eslint-disable @typescript-eslint/require-await */
import { expect } from "chai";
import { LightningEvent, LightningEventQueue, LightningEventType, MessageType } from "../lib";
import {
    createFakeChannelReady,
    createFakeFundingSignedMessage,
    createFakeLightningEventMuxer,
    createFakePeer,
} from "./_test-utils";

describe(LightningEventQueue.name, () => {
    describe(LightningEventQueue.prototype.push.name, () => {
        it("block connection event", done => {
            // arrange
            const muxer = createFakeLightningEventMuxer();
            const event = new LightningEvent(LightningEventType.BlockConnected);
            const sut = new LightningEventQueue(muxer);

            // act
            setImmediate(() => sut.push(event));

            // assertion
            sut.flushed = () => {
                try {
                    expect(muxer.onEvent.args[0][0].type).to.equal(
                        LightningEventType.BlockConnected,
                    );
                    done();
                } catch (ex) {
                    done(ex);
                }
            };
        });

        it("peer readable event", done => {
            // arrange
            const muxer = createFakeLightningEventMuxer();
            const sut = new LightningEventQueue(muxer);
            const peer = createFakePeer();
            peer.fakeMessage(createFakeFundingSignedMessage());

            const event = new LightningEvent(LightningEventType.PeerReadable);
            event.peer = peer;

            // act
            setImmediate(() => sut.push(event));

            // assertion
            sut.flushed = () => {
                try {
                    expect(muxer.onEvent.args[0][0].type).to.equal(LightningEventType.PeerMessage);
                    expect(muxer.onEvent.args[0][0].msg.type).to.equal(MessageType.FundingSigned);
                    done();
                } catch (ex) {
                    done(ex);
                }
            };
        });

        it("peer ready event", done => {
            // arrange
            const muxer = createFakeLightningEventMuxer();
            const event = new LightningEvent(LightningEventType.PeerReady);
            const sut = new LightningEventQueue(muxer);

            // act
            setImmediate(() => sut.push(event));

            // assertion
            sut.flushed = () => {
                try {
                    expect(muxer.onEvent.args[0][0].type).to.equal(LightningEventType.PeerReady);
                    done();
                } catch (ex) {
                    done(ex);
                }
            };
        });

        it("peer disconnected event", done => {
            // arrange
            const muxer = createFakeLightningEventMuxer();
            const sut = new LightningEventQueue(muxer);
            const peer = createFakePeer();
            peer.fakeMessage(createFakeFundingSignedMessage());

            const event = new LightningEvent(LightningEventType.PeerDisconnected);
            event.peer = peer;

            // act
            setImmediate(() => sut.push(event));

            // assertion
            sut.flushed = () => {
                try {
                    expect(muxer.onEvent.args[0][0].type).to.equal(
                        LightningEventType.PeerDisconnected,
                    );
                    done();
                } catch (ex) {
                    done(ex);
                }
            };
        });

        it("triggers sequential events", done => {
            // arrange
            const muxer = createFakeLightningEventMuxer();
            const sut = new LightningEventQueue(muxer);
            const peer = createFakePeer();
            peer.fakeMessage(createFakeFundingSignedMessage());
            peer.fakeMessage(createFakeChannelReady());

            const event = new LightningEvent(LightningEventType.PeerReadable);
            event.peer = peer;

            // act
            setImmediate(() => sut.push(event));

            // assertion
            sut.flushed = () => {
                try {
                    // call 0
                    expect(muxer.onEvent.args[0][0].type).to.equal(LightningEventType.PeerMessage);
                    expect(muxer.onEvent.args[0][0].msg.type).to.equal(MessageType.FundingSigned);

                    // call 1
                    expect(muxer.onEvent.args[1][0].type).to.equal(LightningEventType.PeerMessage);
                    expect(muxer.onEvent.args[1][0].msg.type).to.equal(MessageType.FundingLocked);
                    done();
                } catch (ex) {
                    done(ex);
                }
            };
        });

        it("multiple pushes", done => {
            // arrange
            const muxer = createFakeLightningEventMuxer();
            const sut = new LightningEventQueue(muxer);
            const peer = createFakePeer();
            peer.fakeMessage(createFakeFundingSignedMessage());

            const event1 = new LightningEvent(LightningEventType.PeerReady);

            const event2 = new LightningEvent(LightningEventType.PeerReadable);
            event2.peer = peer;

            // act
            setImmediate(() => {
                sut.push(event1);
                sut.push(event2);
            });

            // assertion
            sut.flushed = () => {
                try {
                    // call 0
                    expect(muxer.onEvent.args[0][0].type).to.equal(LightningEventType.PeerReady);

                    // call 1
                    expect(muxer.onEvent.args[1][0].type).to.equal(LightningEventType.PeerMessage);
                    expect(muxer.onEvent.args[1][0].msg.type).to.equal(MessageType.FundingSigned);
                    done();
                } catch (ex) {
                    done(ex);
                }
            };
        });
    });
});
