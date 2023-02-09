import fs from "fs";
import path from "path";
import { Block, Network } from "@node-lightning/bitcoin";
import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import Sinon from "sinon";
import { IPeer, OpenChannelMessage, PeerState } from "../../lib";
import { ChannelManager } from "../../lib/channels/ChannelManager";
import { IChannelLogic } from "../../lib/channels/IChannelLogic";
import { IChannelStorage } from "../../lib/channels/IChannelStorage";
import { OpenChannelRequest } from "../../lib/channels/OpenChannelRequest";
import { StateMachine } from "../../lib/channels/StateMachine";
import { StateMachineFactory } from "../../lib/channels/StateMachineFactory";
import { AwaitingAcceptChannelState } from "../../lib/channels/states/opening/AwaitingAcceptChannelState";
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
            const channelPeerId = createFakeKey(1n)
                .toPubKey(true)
                .toHex();
            const channelTempId = Buffer.alloc(32);
            const channel = createFakeChannel({
                temporaryId: channelTempId,
                peerId: channelPeerId,
            });
            sut.channels.push(channel);

            // act
            const inputPeerId = createFakeKey(1n)
                .toPubKey(true)
                .toHex();
            const inputTempId = Buffer.alloc(32);
            const result = sut.findChannelByTempId(inputPeerId, inputTempId);

            // assert
            expect(result).to.equal(channel);
        });

        it("returns undefined when peerId doesn't match", () => {
            // arrange
            const channelPeerId = createFakeKey(1n)
                .toPubKey(true)
                .toHex();
            const channelTempId = Buffer.alloc(32);
            const channel = createFakeChannel({
                temporaryId: channelTempId,
                peerId: channelPeerId,
            });
            sut.channels.push(channel);

            // act
            const inputPeerId = createFakeKey(2n)
                .toPubKey(true)
                .toHex();
            const inputTempId = Buffer.alloc(32);
            const result = sut.findChannelByTempId(inputPeerId, inputTempId);

            // assert
            expect(result).to.not.equal(channel);
        });

        it("returns undefined when tempChannelId doesn't match", () => {
            // arrange
            const channelPeerId = createFakeKey(1n)
                .toPubKey(true)
                .toHex();
            const channelTempId = Buffer.alloc(32);
            const channel = createFakeChannel({
                temporaryId: channelTempId,
                peerId: channelPeerId,
            });
            sut.channels.push(channel);

            // act
            const inputPeerId = createFakeKey(1n)
                .toPubKey(true)
                .toHex();
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

        class Root extends StateMachine {}
        class A extends StateMachine {}
        class B extends StateMachine {}
        class C extends StateMachine {}
        class D extends StateMachine {}
        class E extends StateMachine {}
        class F extends StateMachine {}

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            sut = new ChannelManager(logger, undefined, logic, undefined, new Root(logger, logic));
            a = new A(logger, logic);
            b = new B(logger, logic);
            c = new C(logger, logic);
            d = new D(logger, logic);
            e = new E(logger, logic);
            f = new F(logger, logic);
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
            const result = sut.findState("A");

            // assert
            expect(result).to.equal(a);
        });

        it("Root(A,B) => B", () => {
            // arrange
            sut.rootState.addSubState(a).addSubState(b);

            // act
            const result = sut.findState("B");

            // assert
            expect(result).to.equal(b);
        });

        it("Root(A(C),B(D(E(F)))))) => C", () => {
            // arrange
            sut.rootState
                .addSubState(a.addSubState(c))
                .addSubState(b.addSubState(d.addSubState(e).addSubState(f)));

            // act
            const result = sut.findState("C");

            // assert
            expect(result).to.equal(c);
        });

        it("Root(A(C),B(D(E(F)))))) => D", () => {
            // arrange
            sut.rootState
                .addSubState(a.addSubState(c))
                .addSubState(b.addSubState(d.addSubState(e).addSubState(f)));

            // act
            const result = sut.findState("D");

            // assert
            expect(result).to.equal(d);
        });

        it("Root(A(C),B(D(E(F)))))) => E", () => {
            // arrange
            sut.rootState
                .addSubState(a.addSubState(c))
                .addSubState(b.addSubState(d.addSubState(e).addSubState(f)));

            // act
            const result = sut.findState("E");

            // assert
            expect(result).to.equal(e);
        });

        it("Root(A(C),B(D(E(F)))))) => F", () => {
            // arrange
            sut.rootState
                .addSubState(a.addSubState(c))
                .addSubState(b.addSubState(d.addSubState(e).addSubState(f)));

            // act
            const result = sut.findState("F");

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

        class Root extends StateMachine {}
        class A extends StateMachine {}
        class B extends StateMachine {}
        class C extends StateMachine {}

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            storage = createFakeChannelStorage();
            sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                storage,
                new Root(logger, logic),
            );
            sut.rootState.onEnter = Sinon.stub();
            sut.rootState.onExit = Sinon.stub();

            a = new A(logger, logic);
            a.onEnter = Sinon.stub();
            a.onExit = Sinon.stub();

            b = new B(logger, logic);
            b.onEnter = Sinon.stub();
            b.onExit = Sinon.stub();

            c = new C(logger, logic);
            c.onEnter = Sinon.stub();
            c.onExit = Sinon.stub();

            sut.rootState
                .addSubState(a)
                .addSubState(b)
                .addSubState(c);
        });

        describe("initial state", () => {
            it("single change", async () => {
                // arrange
                const channel = createFakeChannel({});

                // act
                await sut.transitionState(channel, "B");

                expect((a.onEnter as Sinon.SinonSpy).called).to.equal(
                    false,
                    "should not call onEnter for A",
                );
                expect((b.onEnter as Sinon.SinonSpy).called).to.equal(true, "call onEnter for B");
                expect((b.onExit as Sinon.SinonSpy).called).to.equal(false, "no-call onExit for B");
                expect(storage.save.called).to.equal(true, "call save");
                expect(channel.state).to.equal(b, "state=B");
            });
        });

        describe("assigned state", () => {
            it("no change", async () => {
                // arrange
                const channel = createFakeChannel({});
                channel.state = a;

                // act
                await sut.transitionState(channel, "A");

                expect((a.onEnter as Sinon.SinonSpy).called).to.equal(
                    false,
                    "shouldn't call onEnter",
                );
                expect((a.onExit as Sinon.SinonSpy).called).to.equal(
                    false,
                    "shouldn't call onExit",
                );
                expect(storage.save.called).to.equal(false, "should not call save");
                expect(channel.state).to.equal(a, "state=A");
            });

            it("single change", async () => {
                // arrange
                const channel = createFakeChannel({});
                channel.state = a;

                // act
                await sut.transitionState(channel, "B");

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
                (b.onEnter as Sinon.SinonStub).resolves("C");

                // act
                await sut.transitionState(channel, "B");

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
                (b.onEnter as Sinon.SinonStub).resolves("D");

                // act
                try {
                    await sut.transitionState(channel, "B");
                    throw new Error("Should have thrown");
                } catch (ex) {
                    expect(ex.message).to.equal("Failed to find state, state=D");
                }
            });
        });
    });

    describe(ChannelManager.prototype.openChannel.name, () => {
        let logger: ILogger;
        let logic: Sinon.SinonStubbedInstance<IChannelLogic>;
        let storage: Sinon.SinonStubbedInstance<IChannelStorage>;
        let sut: ChannelManager;
        let peer: FakePeer;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            storage = createFakeChannelStorage();
            peer = createFakePeer();
            sut = new ChannelManager(
                logger,
                Network.testnet,
                logic,
                storage,
                new StateMachineFactory(logger, logic).construct(),
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
            expect(result.value.state).is.instanceOf(AwaitingAcceptChannelState);
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
            const stateA = createFakeState("A");
            const stateB = createFakeState("B");
            const stateC = createFakeState("C");
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
            expect(stateB.onAcceptChannelMessage.called).to.equal(true);
        });

        it("transitions to new state", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A");
            const stateB = createFakeState("B");
            stateB.onAcceptChannelMessage.resolves("C");
            const stateC = createFakeState("C");
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
            const stateA = createFakeState("A");
            const stateB = createFakeState("B");
            const stateC = createFakeState("C");
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
            expect(stateB.onFundingSignedMessage.called).to.equal(true);
        });

        it("transitions to new state", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A");
            const stateB = createFakeState("B");
            stateB.onFundingSignedMessage.resolves("C");
            const stateC = createFakeState("C");
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
            const stateA = createFakeState("A");
            const stateB = createFakeState("B");
            const stateC = createFakeState("C");
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
            expect(stateB.onBlockConnected.called).to.equal(true);
        });

        it("transitions to new state", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A");
            const stateB = createFakeState("B");
            stateB.onBlockConnected.resolves("C");
            const stateC = createFakeState("C");
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
            const stateA = createFakeState("A");
            const stateB = createFakeState("B");
            const stateC = createFakeState("C");
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
            expect(stateB.onChannelReadyMessage.called).to.equal(true);
        });

        it("transitions to new state", async () => {
            // arrange
            const logger = createFakeLogger();
            const logic = createFakeChannelLogicFacade();
            const stateA = createFakeState("A");
            const stateB = createFakeState("B");
            stateB.onChannelReadyMessage.resolves("C");
            const stateC = createFakeState("C");
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
