import fs from "fs";
import path from "path";
import { Block } from "@node-lightning/bitcoin";
import Sinon from "sinon";
import {
    ChannelAnnouncementMessage,
    ChannelManager,
    ChannelUpdateMessage,
    GossipManager,
    LightningEvent,
    LightningEventMuxer,
    NodeAnnouncementMessage,
    QueryChannelRangeMessage,
    QueryShortChannelIdsMessage,
    ReplyChannelRangeMessage,
    ReplyShortChannelIdsEndMessage,
    MessageType,
} from "../lib";
import {
    createFakeChannelManager,
    createFakeGossipManager,
    createFakeLogger,
    createFakePeer,
} from "./_test-utils";
import { expect } from "chai";
import { Result } from "../lib/Result";
import { AcceptChannelMessage } from "../lib/messages/AcceptChannelMessage";
import { ChannelReadyMessage } from "../lib/messages/ChannelReadyMessage";
import { FundingSignedMessage } from "../lib/messages/FundingSignedMessage";

const REGTEST_BLOCK_100 = fs.readFileSync(
    path.join(__dirname, "../__fixtures__/regtest_block_100.txt"),
    "ascii",
);

describe(LightningEventMuxer.name, () => {
    let channelManager: Sinon.SinonStubbedInstance<ChannelManager>;
    let gossipManager: Sinon.SinonStubbedInstance<GossipManager>;
    let sut: LightningEventMuxer;

    beforeEach(() => {
        channelManager = createFakeChannelManager();
        gossipManager = createFakeGossipManager();
        sut = new LightningEventMuxer(createFakeLogger(), gossipManager, channelManager);
    });

    describe(LightningEventMuxer.prototype.onEvent.name, () => {
        describe("no subsystems", () => {
            beforeEach(() => {
                sut = new LightningEventMuxer(createFakeLogger(), undefined, undefined);
            });

            describe("block_connected", () => {
                it("ok", async () => {
                    // arrange
                    const block = Block.fromHex(REGTEST_BLOCK_100);
                    const event = LightningEvent.createBlockConnected(block);

                    // act
                    const result = await sut.onEvent(event);

                    // assert
                    expect(result.isOk).to.equal(true);
                });
            });

            describe("peer_ready", () => {
                it("ok", async () => {
                    // arrange
                    const peer = createFakePeer();
                    const event = LightningEvent.createPeerReady(peer);

                    // act
                    const result = await sut.onEvent(event);

                    // assert
                    expect(result.isOk).to.equal(true);
                });
            });

            describe("peer_message", () => {
                const messages = [
                    new ChannelAnnouncementMessage(),
                    new ChannelUpdateMessage(),
                    new NodeAnnouncementMessage(),
                    new QueryChannelRangeMessage(),
                    new ReplyChannelRangeMessage(),
                    new QueryShortChannelIdsMessage(),
                    new ReplyShortChannelIdsEndMessage(),
                ];

                for (const message of messages) {
                    it(`routes ${message.type} - ${MessageType[message.type]} ok`, async () => {
                        // arrange
                        const peer = createFakePeer();
                        const event = LightningEvent.createPeerMessage(peer, message);
                        gossipManager.onWireMessage.resolves(Result.ok(message));

                        // act
                        const result = await sut.onEvent(event);

                        // assert
                        expect(result.isOk).to.equal(true);
                    });
                }

                it(
                    `routes ${MessageType.OpenChannel} - ${
                        MessageType[MessageType.OpenChannel]
                    } ok`,
                );

                it(`routes ${MessageType.AcceptChannel} - ${
                    MessageType[MessageType.AcceptChannel]
                } ok`, async () => {
                    // arrange
                    const msg = new AcceptChannelMessage();
                    const peer = createFakePeer();
                    const event = LightningEvent.createPeerMessage(peer, msg);

                    // act
                    const result = await sut.onEvent(event);

                    // assert
                    expect(result.isOk).to.equal(true);
                });

                it(
                    `routes ${MessageType.FundingCreated} - ${
                        MessageType[MessageType.FundingCreated]
                    } ok`,
                );

                it(`routes ${MessageType.FundingSigned} - ${
                    MessageType[MessageType.FundingSigned]
                } ok`, async () => {
                    // arrange
                    const msg = new FundingSignedMessage();
                    const peer = createFakePeer();
                    const event = LightningEvent.createPeerMessage(peer, msg);

                    // act
                    const result = await sut.onEvent(event);

                    // assert
                    expect(result.isOk).to.equal(true);
                });

                it(`routes ${MessageType.FundingLocked} - ${
                    MessageType[MessageType.FundingLocked]
                } ok`, async () => {
                    // arrange
                    const msg = new ChannelReadyMessage();
                    const peer = createFakePeer();
                    const event = LightningEvent.createPeerMessage(peer, msg);

                    // act
                    const result = await sut.onEvent(event);

                    // assert
                    expect(result.isOk).to.equal(true);
                });
            });
        });

        describe("has subsystems", () => {
            describe("block_connected", () => {
                it("calls ChannelManager with block", async () => {
                    // arrange
                    const block = Block.fromHex(REGTEST_BLOCK_100);
                    const event = LightningEvent.createBlockConnected(block);

                    // act
                    const result = await sut.onEvent(event);

                    // assert
                    expect(result.isOk).to.equal(true);
                    expect(channelManager.onBlockConnected.called).to.equal(true);
                    expect(channelManager.onBlockConnected.args[0][0]).to.equal(block);
                });
            });

            describe("peer_ready", () => {
                it("calls GossipManager", async () => {
                    // arrange
                    const peer = createFakePeer();
                    const event = LightningEvent.createPeerReady(peer);
                    sut = new LightningEventMuxer(createFakeLogger(), gossipManager, undefined);

                    // act
                    const result = await sut.onEvent(event);

                    // assert
                    expect(result.isOk).to.equal(true);
                });
            });

            describe("peer_message", () => {
                const messages = [
                    new ChannelAnnouncementMessage(),
                    new ChannelUpdateMessage(),
                    new NodeAnnouncementMessage(),
                    new QueryChannelRangeMessage(),
                    new ReplyChannelRangeMessage(),
                    new QueryShortChannelIdsMessage(),
                    new ReplyShortChannelIdsEndMessage(),
                ];

                for (const message of messages) {
                    it(`routes ${message.type} - ${MessageType[message.type]}`, async () => {
                        // arrange
                        const peer = createFakePeer();
                        const event = LightningEvent.createPeerMessage(peer, message);
                        gossipManager.onWireMessage.resolves(Result.ok(message));

                        // act
                        const result = await sut.onEvent(event);

                        // assert
                        expect(result.isOk).to.equal(true);
                        expect(gossipManager.onWireMessage.called).to.equal(true);
                        expect(gossipManager.onWireMessage.args[0][0]).to.equal(peer);
                        expect(gossipManager.onWireMessage.args[0][1]).to.equal(message);
                    });
                }

                it(`routes ${MessageType.OpenChannel} - ${MessageType[MessageType.OpenChannel]}`);

                it(`routes ${MessageType.AcceptChannel} - ${
                    MessageType[MessageType.AcceptChannel]
                }`, async () => {
                    // arrange
                    const msg = new AcceptChannelMessage();
                    const peer = createFakePeer();
                    const event = LightningEvent.createPeerMessage(peer, msg);

                    // act
                    const result = await sut.onEvent(event);

                    // assert
                    expect(result.isOk).to.equal(true);
                    expect(channelManager.onAcceptChannelMessage.called).to.equal(true);
                    expect(channelManager.onAcceptChannelMessage.args[0][0]).to.equal(peer);
                    expect(channelManager.onAcceptChannelMessage.args[0][1]).to.equal(msg);
                });

                it(
                    `routes ${MessageType.FundingCreated} - ${
                        MessageType[MessageType.FundingCreated]
                    }`,
                );

                it(`routes ${MessageType.FundingSigned} - ${
                    MessageType[MessageType.FundingSigned]
                }`, async () => {
                    // arrange
                    const msg = new FundingSignedMessage();
                    const peer = createFakePeer();
                    const event = LightningEvent.createPeerMessage(peer, msg);

                    // act
                    const result = await sut.onEvent(event);

                    // assert
                    expect(result.isOk).to.equal(true);
                    expect(channelManager.onFundingSignedMessage.called).to.equal(true);
                    expect(channelManager.onFundingSignedMessage.args[0][0]).to.equal(peer);
                    expect(channelManager.onFundingSignedMessage.args[0][1]).to.equal(msg);
                });

                it(`routes ${MessageType.FundingLocked} - ${
                    MessageType[MessageType.FundingLocked]
                }`, async () => {
                    // arrange
                    const msg = new ChannelReadyMessage();
                    const peer = createFakePeer();
                    const event = LightningEvent.createPeerMessage(peer, msg);

                    // act
                    const result = await sut.onEvent(event);

                    // assert
                    expect(result.isOk).to.equal(true);
                    expect(channelManager.onChannelReadyMessage.called).to.equal(true);
                    expect(channelManager.onChannelReadyMessage.args[0][0]).to.equal(peer);
                    expect(channelManager.onChannelReadyMessage.args[0][1]).to.equal(msg);
                });
            });
        });
    });
});
