import fs from "fs";
import path from "path";
import { Block, Network } from "@node-lightning/bitcoin";
import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import Sinon from "sinon";
import { IPeer, OpenChannelMessage, PeerState, TransitionFactory } from "../../lib";
import { ChannelManager } from "../../lib/channels/ChannelManager";
import { IChannelLogic } from "../../lib/channels/IChannelLogic";
import { IChannelStorage } from "../../lib/channels/IChannelStorage";
import { OpenChannelRequest } from "../../lib/channels/OpenChannelRequest";
import { StateMachine } from "../../lib/channels/StateMachine";
import { ChannelStateId, StateMachineFactory } from "../../lib/channels/StateMachineFactory";
import { OpeningError } from "../../lib/channels/states/opening/OpeningError";
import { OpeningErrorType } from "../../lib/channels/states/opening/OpeningErrorType";
import { Result } from "../../lib/Result";
import {
    createFakeAcceptChannel,
    createFakeChannel,
    createFakeChannelLogicFacade,
    createFakeChannelReady,
    createFakeChannelStorage,
    createFakeFundingSignedMessage,
    createFakeFundingTx,
    createFakeKey,
    createFakeLogger,
    createFakePeer,
    createFakeState,
    createFakeTransitionFactory,
    FakePeer,
} from "../_test-utils";

const REGTEST_BLOCK_100 = fs.readFileSync(
    path.join(__dirname, "../../__fixtures__/regtest_block_100.txt"),
    "ascii",
);

describe(ChannelManager.name, () => {
    describe(ChannelManager.prototype.findChannelByTempId.name, () => {
        let sut: ChannelManager;

        beforeEach(() => {
            sut = new ChannelManager(
                createFakeLogger(),
                undefined,
                undefined,
                undefined,
                undefined,
            );
        });

        it("returns channel when matching the tempChannelId and peerId", () => {
            // arrange
            const channelPeerId = createFakeKey(1n).toPubKey(true).toHex();
            const channelTempId = Buffer.alloc(32);
            const channel = createFakeChannel({
                temporaryId: channelTempId,
                peerId: channelPeerId,
            });
            sut.channels.push(channel);

            // act
            const inputPeerId = createFakeKey(1n).toPubKey(true).toHex();
            const inputTempId = Buffer.alloc(32);
            const result = sut.findChannelByTempId(inputPeerId, inputTempId);

            // assert
            expect(result).to.equal(channel);
        });

        it("returns undefined when peerId doesn't match", () => {
            // arrange
            const channelPeerId = createFakeKey(1n).toPubKey(true).toHex();
            const channelTempId = Buffer.alloc(32);
            const channel = createFakeChannel({
                temporaryId: channelTempId,
                peerId: channelPeerId,
            });
            sut.channels.push(channel);

            // act
            const inputPeerId = createFakeKey(2n).toPubKey(true).toHex();
            const inputTempId = Buffer.alloc(32);
            const result = sut.findChannelByTempId(inputPeerId, inputTempId);

            // assert
            expect(result).to.not.equal(channel);
        });

        it("returns undefined when tempChannelId doesn't match", () => {
            // arrange
            const channelPeerId = createFakeKey(1n).toPubKey(true).toHex();
            const channelTempId = Buffer.alloc(32);
            const channel = createFakeChannel({
                temporaryId: channelTempId,
                peerId: channelPeerId,
            });
            sut.channels.push(channel);

            // act
            const inputPeerId = createFakeKey(1n).toPubKey(true).toHex();
            const inputTempId = Buffer.alloc(32, 0x255);
            const result = sut.findChannelByTempId(inputPeerId, inputTempId);

            // assert
            expect(result).to.not.equal(channel);
        });
    });

    describe(ChannelManager.prototype.findState.name, () => {
        let logger: ILogger;
        let logic: IChannelLogic;
        let sut: ChannelManager;
        let a: StateMachine;
        let b: StateMachine;
        let c: StateMachine;
        let d: StateMachine;
        let e: StateMachine;
        let f: StateMachine;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            sut = new ChannelManager(
                logger,
                undefined,
                logic,
                undefined,
                new StateMachine(logger, "Root"),
            );
            a = new StateMachine(logger, "A");
            b = new StateMachine(logger, "B");
            c = new StateMachine(logger, "C");
            d = new StateMachine(logger, "D");
            e = new StateMachine(logger, "E");
            f = new StateMachine(logger, "F");
        });

        it("Root => Root", () => {
            // act
            const result = sut.findState("Root");

            // assert
            expect(result).to.equal(sut.rootState);
        });

        it("Root => undefined", () => {
            // act
            const result = sut.findState("DoesNotExist");

            // assert
            expect(result).to.equal(undefined);
        });

        it("Root(A,B) => A", () => {
            // arrange
            sut.rootState.addSubState(a).addSubState(b);

            // act
            const result = sut.findState("Root.A");

            // assert
            expect(result).to.equal(a);
        });

        it("Root(A,B) => B", () => {
            // arrange
            sut.rootState.addSubState(a).addSubState(b);

            // act
            const result = sut.findState("Root.B");

            // assert
            expect(result).to.equal(b);
        });

        it("Root(A(C),B(D(E(F)))))) => C", () => {
            // arrange
            sut.rootState
                .addSubState(a.addSubState(c))
                .addSubState(b.addSubState(d.addSubState(e).addSubState(f)));

            // act
            const result = sut.findState("Root.A.C");

            // assert
            expect(result).to.equal(c);
        });

        it("Root(A(C),B(D(E(F)))))) => D", () => {
            // arrange
            sut.rootState
                .addSubState(a.addSubState(c))
                .addSubState(b.addSubState(d.addSubState(e).addSubState(f)));

            // act
            const result = sut.findState("Root.B.D");

            // assert
            expect(result).to.equal(d);
        });

        it("Root(A(C),B(D(E(F)))))) => E", () => {
            // arrange
            sut.rootState
                .addSubState(a.addSubState(c))
                .addSubState(b.addSubState(d.addSubState(e).addSubState(f)));

            // act
            const result = sut.findState("Root.B.D.E");

            // assert
            expect(result).to.equal(e);
        });

        it("Root(A(C),B(D(E,F))))) => F", () => {
            // arrange
            sut.rootState
                .addSubState(a.addSubState(c))
                .addSubState(b.addSubState(d.addSubState(e).addSubState(f)));

            // act
            const result = sut.findState("Root.B.D.F");

            // assert
            expect(result).to.equal(f);
        });

        it("Root(A(C),B(D(E(F)))))) => undefined", () => {
            // arrange
            sut.rootState
                .addSubState(a.addSubState(c))
                .addSubState(b.addSubState(d.addSubState(e).addSubState(f)));

            // act
            const result = sut.findState("DoesNotExist");

            // assert
            expect(result).to.equal(undefined);
        });
    });

    describe(ChannelManager.prototype.transitionState.name, () => {
        let logger: ILogger;
        let logic: IChannelLogic;
        let storage: Sinon.SinonStubbedInstance<IChannelStorage>;
        let sut: ChannelManager;
        let a: StateMachine;
        let b: StateMachine;
        let c: StateMachine;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            storage = createFakeChannelStorage();
            sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                storage,
                new StateMachine(logger, "Root"),
            );
            sut.rootState.onEnter = Sinon.stub();
            sut.rootState.onExit = Sinon.stub();

            a = new StateMachine(logger, "A");
            a.onEnter = Sinon.stub();
            a.onExit = Sinon.stub();

            b = new StateMachine(logger, "B");
            b.onEnter = Sinon.stub();
            b.onExit = Sinon.stub();

            c = new StateMachine(logger, "C");
            c.onEnter = Sinon.stub();
            c.onExit = Sinon.stub();

            sut.rootState.addSubState(a).addSubState(b).addSubState(c);
        });

        describe("initial state", () => {
            it("single change", async () => {
                // arrange
                const channel = createFakeChannel({});

                // act
                await sut.transitionState(channel, "Root.B");

                expect((a.onEnter as Sinon.SinonSpy).called).to.equal(
                    false,
                    "should not call onEnter for A",
                );
                expect((b.onEnter as Sinon.SinonSpy).called).to.equal(true, "call onEnter for B");
                expect((b.onExit as Sinon.SinonSpy).called).to.equal(false, "no-call onExit for B");
                expect(storage.save.called).to.equal(true, "call save");
                expect(channel.state).to.equal(b, "state=Root.B");
            });
        });

        describe("assigned state", () => {
            it("no change", async () => {
                // arrange
                const channel = createFakeChannel({});
                channel.state = a;

                // act
                await sut.transitionState(channel, "Root.A");

                expect((a.onEnter as Sinon.SinonSpy).called).to.equal(
                    false,
                    "shouldn't call onEnter",
                );
                expect((a.onExit as Sinon.SinonSpy).called).to.equal(
                    false,
                    "shouldn't call onExit",
                );
                expect(storage.save.called).to.equal(false, "should not call save");
                expect(channel.state).to.equal(a, "state=Root.A");
            });

            it("single change", async () => {
                // arrange
                const channel = createFakeChannel({});
                channel.state = a;

                // act
                await sut.transitionState(channel, "Root.B");

                expect((a.onEnter as Sinon.SinonSpy).called).to.equal(
                    false,
                    "should not call onEnter for A",
                );
                expect((a.onExit as Sinon.SinonSpy).called).to.equal(true, "call onExit for A");
                expect((b.onEnter as Sinon.SinonSpy).called).to.equal(true, "call onEnter for B");
                expect((b.onExit as Sinon.SinonSpy).called).to.equal(false, "no-call onExit for B");
                expect(storage.save.called).to.equal(true, "call save");
                expect(channel.state).to.equal(b, "state=B");
            });

            it("onExit change", async () => {
                // arrange
                const channel = createFakeChannel({});
                channel.state = a;
                (b.onEnter as Sinon.SinonStub).resolves("Root.C");

                // act
                await sut.transitionState(channel, "Root.B");

                expect((a.onEnter as Sinon.SinonSpy).called).to.equal(
                    false,
                    "no-call onEnter for A",
                );
                expect((a.onExit as Sinon.SinonSpy).called).to.equal(true, "call onExit for A");
                expect((b.onEnter as Sinon.SinonSpy).called).to.equal(true, "call onEnter for B");
                expect((b.onExit as Sinon.SinonSpy).called).to.equal(true, "call onExit for B");
                expect((c.onEnter as Sinon.SinonSpy).called).to.equal(true, "call onEnter for C");
                expect((c.onExit as Sinon.SinonSpy).called).to.equal(false, "no-call onExit for C");
                expect(storage.save.called).to.equal(true, "call save");
                expect(channel.state).to.equal(c, "state=C");
            });

            it("throws if not found", async () => {
                // arrange
                const channel = createFakeChannel({});
                channel.state = a;
                (b.onEnter as Sinon.SinonStub).resolves("Root.D");

                // act
                try {
                    await sut.transitionState(channel, "Root.B");
                    throw new Error("Should have thrown");
                } catch (ex) {
                    expect(ex.message).to.equal("Failed to find state, state=Root.D");
                }
            });
        });
    });

    describe(ChannelManager.prototype.openChannel.name, () => {
        let logger: ILogger;
        let transitionFactory: TransitionFactory;
        let logic: Sinon.SinonStubbedInstance<IChannelLogic>;
        let storage: Sinon.SinonStubbedInstance<IChannelStorage>;
        let sut: ChannelManager;
        let peer: FakePeer;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            transitionFactory = new TransitionFactory(logger, logic);
            storage = createFakeChannelStorage();
            peer = createFakePeer();
            sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                storage,
                new StateMachineFactory(logger, transitionFactory).construct(),
            );
        });

        it("returns error if peer not ready", async () => {
            // arrange
            peer.state = PeerState.Disconnected;
            const request = new OpenChannelRequest();

            // act
            const result = await sut.openChannel(peer as IPeer, request);

            // assert
            expect(result.isErr).to.equal(true);
            expect(result.error.type).to.equal(OpeningErrorType.PeerNotReady);
        });

        it("returns error if constructing the channel fails for reasons in createChannel", async () => {
            // arrange
            peer.state = PeerState.Ready;
            const request = new OpenChannelRequest();
            logic.createChannel.resolves(
                Result.err(new OpeningError(OpeningErrorType.FundsNotAvailable)),
            );

            // act
            const result = await sut.openChannel(peer, request);

            // assert
            expect(result.isErr).to.equal(true);
            expect(result.error.type).to.equal(OpeningErrorType.FundsNotAvailable);
        });

        it("sends the message to the peer", async () => {
            // arrange
            peer.state = PeerState.Ready;
            const request = new OpenChannelRequest();
            logic.createChannel.resolves(Result.ok(createFakeChannel({})));
            logic.createOpenChannelMessage.resolves(new OpenChannelMessage());

            // act
            const result = await sut.openChannel(peer, request);

            // assert
            expect(result.isOk).to.equal(true);
            expect(logic.sendMessage.called).to.equal(true);
            expect(logic.sendMessage.args[0][0]).to.equal(peer.id);
            expect(logic.sendMessage.args[0][1]).to.be.instanceOf(OpenChannelMessage);
        });

        it("transitions to AwaitingAcceptMessage state", async () => {
            // arrange
            peer.state = PeerState.Ready;
            const request = new OpenChannelRequest();
            logic.createChannel.resolves(Result.ok(createFakeChannel({})));

            // act
            const result = await sut.openChannel(peer, request);

            // assert
            expect(result.isOk).to.equal(true);
            expect(result.value.state.name).equals("awaiting_accept_channel");
        });

        it("adds to list of channels", async () => {
            // arrange
            peer.state = PeerState.Ready;
            const request = new OpenChannelRequest();
            logic.createChannel.resolves(Result.ok(createFakeChannel({})));

            // act
            const result = await sut.openChannel(peer, request);

            // assert
            expect(sut.channels.length).to.equal(1);
            expect(sut.channels).contains(result.value);
        });
    });

    describe(ChannelManager.prototype.onAcceptChannelMessage.name, () => {
        it("fails if channel not found");

        it("calls onAcceptChannelMessage", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A", "A");
            const stateB = createFakeState("B", "A.B");
            const stateC = createFakeState("C", "A.C");
            stateA.addSubState(stateB).addSubState(stateC);

            const sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                createFakeChannelStorage(),
                stateA,
            );

            const channel = createFakeChannel();
            channel.state = stateB;

            sut.channels.push(channel);
            const peer = createFakePeer();
            const msg = createFakeAcceptChannel();

            // act
            await sut.onAcceptChannelMessage(peer, msg);

            // assert
            expect(stateB.onEvent.called).to.equal(true);
        });

        it("transitions to new state", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A", "A");
            const stateB = createFakeState("B", "A.B");
            stateB.onEvent.resolves("A.C" as ChannelStateId);
            const stateC = createFakeState("C", "A.C");
            stateA.addSubState(stateB).addSubState(stateC);

            const sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                createFakeChannelStorage(),
                stateA,
            );

            const channel = createFakeChannel();
            channel.state = stateB;

            sut.channels.push(channel);
            const peer = createFakePeer();
            const msg = createFakeAcceptChannel();

            // act
            await sut.onAcceptChannelMessage(peer, msg);

            // assert
            expect(channel.state).to.equal(stateC);
        });
    });

    describe(ChannelManager.prototype.onFundingSignedMessage.name, () => {
        it("fails if channel not found");

        it("calls onFundingSignedMessage", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A", "A");
            const stateB = createFakeState("B", "A.B");
            const stateC = createFakeState("C", "A.C");
            stateA.addSubState(stateB).addSubState(stateC);

            const sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                createFakeChannelStorage(),
                stateA,
            );

            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx());
            channel.state = stateB;

            sut.channels.push(channel);
            const peer = createFakePeer();
            const msg = createFakeFundingSignedMessage();

            // act
            await sut.onFundingSignedMessage(peer, msg);

            // assert
            expect(stateB.onEvent.called).to.equal(true);
        });

        it("transitions to new state", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A", "A");
            const stateB = createFakeState("B", "A.B");
            stateB.onEvent.resolves("A.C" as ChannelStateId);
            const stateC = createFakeState("C", "A.C");
            stateA.addSubState(stateB).addSubState(stateC);

            const sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                createFakeChannelStorage(),
                stateA,
            );

            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx());
            channel.state = stateB;

            sut.channels.push(channel);
            const peer = createFakePeer();
            const msg = createFakeFundingSignedMessage();

            // act
            await sut.onFundingSignedMessage(peer, msg);

            // assert
            expect(channel.state).to.equal(stateC);
        });
    });

    describe(ChannelManager.prototype.onBlockConnected.name, () => {
        it("continues if there is a failure");

        it("calls onBlockConnected", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A", "A");
            const stateB = createFakeState("B", "A.B");
            const stateC = createFakeState("C", "A.C");
            stateA.addSubState(stateB).addSubState(stateC);

            const sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                createFakeChannelStorage(),
                stateA,
            );

            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx());
            channel.state = stateB;

            sut.channels.push(channel);
            const peer = createFakePeer();
            const msg = createFakeFundingSignedMessage();
            const block: Block = Block.fromHex(REGTEST_BLOCK_100);

            // act
            await sut.onBlockConnected(block);

            // assert
            expect(stateB.onEvent.called).to.equal(true);
        });

        it("transitions to new state", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A", "A");
            const stateB = createFakeState("B", "A.B");
            stateB.onEvent.resolves("A.C" as ChannelStateId);
            const stateC = createFakeState("C", "A.C");
            stateA.addSubState(stateB).addSubState(stateC);

            const sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                createFakeChannelStorage(),
                stateA,
            );

            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx());
            channel.state = stateB;

            sut.channels.push(channel);
            const peer = createFakePeer();
            const msg = createFakeFundingSignedMessage();
            const block: Block = Block.fromHex(REGTEST_BLOCK_100);

            // act
            await sut.onBlockConnected(block);

            // assert
            expect(channel.state).to.equal(stateC);
        });
    });

    describe(ChannelManager.prototype.onChannelReadyMessage.name, () => {
        it("fails if channel not found");

        it("calls onChannelReadyMessage", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A", "A");
            const stateB = createFakeState("B", "A.B");
            const stateC = createFakeState("C", "A.C");
            stateA.addSubState(stateB).addSubState(stateC);

            const sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                createFakeChannelStorage(),
                stateA,
            );

            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx());
            channel.state = stateB;

            sut.channels.push(channel);
            const peer = createFakePeer();
            const msg = createFakeChannelReady();

            // act
            await sut.onChannelReadyMessage(peer, msg);

            // assert
            expect(stateB.onEvent.called).to.equal(true);
        });

        it("transitions to new state", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A", "A");
            const stateB = createFakeState("B", "A.B");
            stateB.onEvent.resolves("A.C" as ChannelStateId);
            const stateC = createFakeState("C", "A.C");
            stateA.addSubState(stateB).addSubState(stateC);

            const sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                createFakeChannelStorage(),
                stateA,
            );

            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx());
            channel.state = stateB;

            sut.channels.push(channel);
            const peer = createFakePeer();
            const msg = createFakeChannelReady();

            // act
            await sut.onChannelReadyMessage(peer, msg);

            // assert
            expect(channel.state).to.equal(stateC);
        });
    });
});
