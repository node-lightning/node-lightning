import { TxBuilder, Value } from "@node-lightning/bitcoin";
import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import { ChannelStateId, IChannelStorage, IWireMessage, MessageType } from "../../lib";
import { Channel } from "../../lib/channels/Channel";
import { IChannelLogic } from "../../lib/channels/IChannelLogic";
import { OpeningError } from "../../lib/channels/OpeningError";
import { OpeningErrorType } from "../../lib/channels/OpeningErrorType";
import { AcceptChannelMessage } from "../../lib/messages/AcceptChannelMessage";
import { FundingCreatedMessage } from "../../lib/messages/FundingCreatedMessage";
import { Result } from "../../lib/Result";
import { TransitionFactory } from "../../lib";
import {
    createFakeAcceptChannel,
    createFakeBlock,
    createFakeChannel,
    createFakeChannelLogicFacade,
    createFakeChannelReady,
    createFakeChannelStorage,
    createFakeErrorMessage,
    createFakeFundingCreatedMessage,
    createFakeFundingSignedMessage,
    createFakeFundingTx,
    createFakeLogger,
    createFakePeer,
} from "../_test-utils";
import { ChannelEvent } from "../../lib/channels/ChannelEvent";
import { ChannelEventType } from "../../lib/channels/ChannelEventType";
import { FundingSignedMessage } from "../../lib/messages/FundingSignedMessage";

describe(TransitionFactory.name, () => {
    describe(TransitionFactory.prototype.createOnAcceptChannelMessageTransition.name, () => {
        let logger: ILogger;
        let logic: sinon.SinonStubbedInstance<IChannelLogic>;
        let sut: TransitionFactory;
        let channel: Channel;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            sut = new TransitionFactory(logger, logic, createFakeChannelStorage());
            channel = createFakeChannel();
        });

        describe("invalid message", () => {
            beforeEach(() => {
                logic.validateAcceptChannel.resolves(
                    OpeningError.toResult(OpeningErrorType.DustLimitTooLow),
                );
            });

            it("transitions to Failing", async () => {
                // arrange
                const msg = createFakeAcceptChannel({ dustLimitValue: Value.fromSats(200) });
                const event = new ChannelEvent(ChannelEventType.AcceptChannelMessage, channel);
                event.message = msg;

                // act
                const result = await sut.createOnAcceptChannelMessageTransition()(event);

                // assert
                expect(result).to.equal(ChannelStateId.Channel_Failing);
            });
        });

        describe("valid message", () => {
            let msg: AcceptChannelMessage;
            let event: ChannelEvent;
            let sig: Buffer;

            beforeEach(() => {
                msg = createFakeAcceptChannel();
                event = new ChannelEvent(ChannelEventType.AcceptChannelMessage, channel);
                event.message = msg;

                sig = Buffer.alloc(64, 0xff);
                logic.validateAcceptChannel.resolves(Result.ok(true));
                logic.createFundingTx.resolves(createFakeFundingTx());
                logic.createRemoteCommitmentTx.resolves([new TxBuilder(), []]);
                logic.signCommitmentTx.resolves(sig);
                logic.createFundingCreatedMessage.resolves(
                    createFakeFundingCreatedMessage({ sig }),
                );
            });

            it("attaches accept_channel data to channel", async () => {
                // arrange
                expect(channel.theirSide.fundingPubKey).to.equal(undefined);

                // act
                await sut.createOnAcceptChannelMessageTransition()(event);

                // assert
                expect(channel.theirSide.fundingPubKey).to.not.equal(undefined);
            });

            it("attaches funding tx to channel", async () => {
                // arrange
                expect(channel.fundingTx).to.equal(undefined);

                // act
                await sut.createOnAcceptChannelMessageTransition()(event);

                // assert
                expect(channel.fundingTx).to.not.equal(undefined);
            });

            it("sends create_funding message to peer", async () => {
                // act
                await sut.createOnAcceptChannelMessageTransition()(event);

                // assert
                expect(logic.sendMessage.called).to.equal(true);
                expect(logic.sendMessage.args[0][0]).to.equal(channel.peerId);
                expect((logic.sendMessage.args[0][1] as IWireMessage).type).to.equal(
                    FundingCreatedMessage.type,
                );
            });

            it("transitions to awaiting_funding_signed", async () => {
                // act
                const result = await sut.createOnAcceptChannelMessageTransition()(event);

                // assert
                expect(result).to.equal(ChannelStateId.Channel_Initializing_AwaitingFundingSigned);
            });
        });
    });

    describe(TransitionFactory.prototype.createOnFundingSignedMessageTransition.name, () => {
        let logger: ILogger;
        let logic: sinon.SinonStubbedInstance<IChannelLogic>;
        let sut: TransitionFactory;
        let channel: Channel;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            sut = new TransitionFactory(logger, logic, createFakeChannelStorage());
            channel = createFakeChannel().attachAcceptChannel(createFakeAcceptChannel());
        });

        describe("invalid message", () => {
            beforeEach(() => {
                logic.validateFundingSignedMessage.resolves(
                    OpeningError.toResult(OpeningErrorType.InvalidCommitmentSig),
                );
            });

            it("returns failed state on validation error", async () => {
                // arrange
                const msg = createFakeFundingSignedMessage();
                const event = new ChannelEvent(ChannelEventType.FundingSignedMessage, channel);
                event.message = msg;

                // act
                const result = await sut.createOnFundingSignedMessageTransition()(event);

                // assert
                expect(result).to.equal(ChannelStateId.Channel_Failing);
            });
        });
        describe("valid message", () => {
            let msg: FundingSignedMessage;
            let event: ChannelEvent;

            beforeEach(() => {
                msg = createFakeFundingSignedMessage();
                event = new ChannelEvent(ChannelEventType.FundingSignedMessage, channel);
                event.message = msg;

                channel.attachFundingTx(createFakeFundingTx());
                logic.validateFundingSignedMessage.resolves(Result.ok(true));
            });

            it("attaches signature to channel", async () => {
                // arrange
                expect(channel.ourSide.nextCommitmentSig).to.equal(undefined);

                // act
                await sut.createOnFundingSignedMessageTransition()(event);

                // assert
                expect(channel.ourSide.nextCommitmentSig).to.not.equal(undefined);
            });

            it("broadcasts the funding transaction", async () => {
                // act
                await sut.createOnFundingSignedMessageTransition()(event);

                // assert
                expect(logic.broadcastTx.called).to.equal(true, "broadcasts funding tx");
            });

            it("transitions to Channel_Funding_AwaitingFundingConf_NoChannelReady state", async () => {
                // act
                const result = await sut.createOnFundingSignedMessageTransition()(event);

                // assert
                expect(result).to.equal(
                    ChannelStateId.Channel_Funding_AwaitingFundingConf_NoChannelReady,
                );
            });
        });
    });

    describe(TransitionFactory.prototype.createBlockConnectedFundingConfirmed.name, () => {
        let logger: ILogger;
        let logic: sinon.SinonStubbedInstance<IChannelLogic>;
        let sut: TransitionFactory;
        let channel: Channel;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            sut = new TransitionFactory(logger, logic, createFakeChannelStorage());
            channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage());
        });

        it("not confirmed => ignores", async () => {
            // arrange
            const block = createFakeBlock();
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            event.block = block;

            // act
            const result = await sut.createBlockConnectedFundingConfirmed()(event);

            // assert
            expect(channel.fundingConfirmedHeight).to.equal(undefined);
            expect(result).to.equal(undefined);
        });

        it("confirmed => attaches height, Channel_Funding_AwaitingFundingDepth", async () => {
            // arrange
            const fundingTx = createFakeFundingTx();
            const block = createFakeBlock(500_000, fundingTx);
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            event.block = block;

            // act
            const result = await sut.createBlockConnectedFundingConfirmed()(event);

            // assert
            expect(channel.fundingConfirmedHeight).to.equal(500_000);
            expect(channel.readyHeight).to.equal(500_005);
            expect(result).to.equal(ChannelStateId.Channel_Funding_AwaitingFundingDepth);
        });
    });

    describe(TransitionFactory.prototype.createBlockConnectedFundingDepthReached.name, () => {
        let logger: ILogger;
        let logic: sinon.SinonStubbedInstance<IChannelLogic>;
        let sut: TransitionFactory;
        let channel: Channel;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            sut = new TransitionFactory(logger, logic, createFakeChannelStorage());
            channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage());
        });

        it("confirmed + height => ignores", async () => {
            // arrange
            channel.markConfirmed(500_000);
            const block = createFakeBlock(500_001);
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            event.block = block;

            // act
            const result = await sut.createBlockConnectedFundingDepthReached()(event);

            // assert
            expect(channel.fundingConfirmedHeight).to.equal(500_000);
            expect(channel.readyHeight).to.equal(500_005);
            expect(result).to.equal(undefined);
        });

        it("meets depth, no channel_ready => sends channel_ready + transitions to awaiting_channel_ready", async () => {
            // arrange
            channel.markConfirmed(500_000);
            const block = createFakeBlock(500_005);
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            event.block = block;

            // act
            const result = await sut.createBlockConnectedFundingDepthReached()(event);

            // assert
            expect(result).to.equal(ChannelStateId.Channel_Funding_AwaitingChannelReady);
            expect(logic.sendMessage.called).to.equal(true);
        });

        it("meets depth + has channel_ready => sends channel_ready + transitions to normal", async () => {
            // arrange
            channel.markConfirmed(500_000);
            channel.attachChannelReady(createFakeChannelReady());

            const block = createFakeBlock(500_006);
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            event.block = block;

            // act
            const result = await sut.createBlockConnectedFundingDepthReached()(event);

            // assert
            expect(result).to.equal(ChannelStateId.Channel_Normal);
            expect(logic.sendMessage.called).to.equal(true); // arrange
        });
    });

    describe(TransitionFactory.prototype.createOnAcceptChannelMessageTransition.name, () => {
        let logger: ILogger;
        let logic: sinon.SinonStubbedInstance<IChannelLogic>;
        let sut: TransitionFactory;
        let channel: Channel;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            sut = new TransitionFactory(logger, logic, createFakeChannelStorage());
            channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage());
        });

        describe("in awaiting_funding_depth", () => {
            it("transitions Failed when invalid", async () => {
                // arrange
                const msg = createFakeChannelReady();
                const event = new ChannelEvent(ChannelEventType.ChannelReadyMessage, channel);
                event.message = msg;
                logic.validateChannelReadyMessage.returns(false);

                // act
                const result = await sut.createOnChannelReadyTransition(
                    ChannelStateId.Channel_Funding_AwaitingFundingDepth,
                )(event);

                // assert
                expect(result).to.equal(ChannelStateId.Channel_Failing);
            });

            it("attaches next_per_commitment_point + stays", async () => {
                // arrange
                const msg = createFakeChannelReady();
                const event = new ChannelEvent(ChannelEventType.ChannelReadyMessage, channel);
                event.message = msg;
                logic.validateChannelReadyMessage.returns(true);

                // act
                const result = await sut.createOnChannelReadyTransition(
                    ChannelStateId.Channel_Funding_AwaitingFundingDepth,
                )(event);
                expect(result).to.equal(ChannelStateId.Channel_Funding_AwaitingFundingDepth);
                expect(channel.theirSide.commitmentNumber.value).to.equal(0n);
                expect(channel.theirSide.commitmentPoint.toHex()).to.equal(
                    "0288a618cb6027c3218a37cbe9e882379f17d87d03f6e99d0b60292478d2aded06",
                );
                expect(channel.theirSide.nextCommitmentNumber.value).to.equal(1n);
                expect(channel.theirSide.nextCommitmentPoint.toHex()).to.equal(
                    "032405cbd0f41225d5f203fe4adac8401321a9e05767c5f8af97d51d2e81fbb206",
                );
            });
        });

        describe("in awaiting_channel_ready", () => {
            it("transitions Failed when invalid", async () => {
                // arrange
                const msg = createFakeChannelReady();
                logic.validateChannelReadyMessage.returns(false);
                const event = new ChannelEvent(ChannelEventType.ChannelReadyMessage, channel);
                event.message = msg;

                // act
                const result = await sut.createOnChannelReadyTransition(
                    ChannelStateId.Channel_Normal,
                )(event);

                // assert
                expect(result).to.equal(ChannelStateId.Channel_Failing);
            });

            it("attaches next_per_commitment_point + normal", async () => {
                // arrange
                const msg = createFakeChannelReady();
                logic.validateChannelReadyMessage.returns(true);
                const event = new ChannelEvent(ChannelEventType.ChannelReadyMessage, channel);
                event.message = msg;

                // act
                const result = await sut.createOnChannelReadyTransition(
                    ChannelStateId.Channel_Normal,
                )(event);
                expect(result).to.equal(ChannelStateId.Channel_Normal);
                expect(channel.theirSide.commitmentNumber.value).to.equal(0n);
                expect(channel.theirSide.commitmentPoint.toHex()).to.equal(
                    "0288a618cb6027c3218a37cbe9e882379f17d87d03f6e99d0b60292478d2aded06",
                );
                expect(channel.theirSide.nextCommitmentNumber.value).to.equal(1n);
                expect(channel.theirSide.nextCommitmentPoint.toHex()).to.equal(
                    "032405cbd0f41225d5f203fe4adac8401321a9e05767c5f8af97d51d2e81fbb206",
                );
            });
        });
    });

    describe(TransitionFactory.prototype.createConnectedAbandon.name, () => {
        let logger: ILogger;
        let logic: sinon.SinonStubbedInstance<IChannelLogic>;
        let storage: sinon.SinonStubbedInstance<IChannelStorage>;
        let sut: TransitionFactory;
        let channel: Channel;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            storage = createFakeChannelStorage();
            sut = new TransitionFactory(logger, logic, storage);
            channel = createFakeChannel().attachAcceptChannel(createFakeAcceptChannel());
        });

        it("removes the channel", async () => {
            // arrange
            const event = new ChannelEvent(ChannelEventType.ShutdownMessage, channel);
            const transition = sut.createConnectedAbandon();

            // act
            const result = await transition(event);

            // assert
            expect(result).to.equal(ChannelStateId.Channel_Abandoned);
            expect(storage.remove.called).to.equal(true);
            expect(storage.remove.args[0][0]).to.deep.equal(channel);
        });

        it("sends the error message", async () => {
            // arrange
            logic.createErrorMessage.returns(createFakeErrorMessage());
            const event = new ChannelEvent(ChannelEventType.ShutdownMessage, channel);
            const transition = sut.createConnectedAbandon();

            // act
            const result = await transition(event);

            // assert
            expect(result).to.equal(ChannelStateId.Channel_Abandoned);
            expect(logic.sendMessage.called).to.equal(true);
            expect(logic.sendMessage.args[0][0]).to.equal(createFakePeer().id);
            expect(logic.sendMessage.args[0][1].type).to.equal(MessageType.Error);
        });
    });

    describe(TransitionFactory.prototype.createDisconnectedAbandon.name, () => {
        let logger: ILogger;
        let logic: sinon.SinonStubbedInstance<IChannelLogic>;
        let storage: sinon.SinonStubbedInstance<IChannelStorage>;
        let sut: TransitionFactory;
        let channel: Channel;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            storage = createFakeChannelStorage();
            sut = new TransitionFactory(logger, logic, storage);
            channel = createFakeChannel().attachAcceptChannel(createFakeAcceptChannel());
        });

        it("removes the channel", async () => {
            // arrange
            const event = new ChannelEvent(ChannelEventType.ShutdownMessage, channel);
            const transition = sut.createConnectedAbandon();

            // act
            const result = await transition(event);

            // assert
            expect(result).to.equal(ChannelStateId.Channel_Abandoned);
            expect(storage.remove.called).to.equal(true);
            expect(storage.remove.args[0][0]).to.deep.equal(channel);
        });

        it("does not send an error message", async () => {
            // arrange
            logic.createErrorMessage.returns(createFakeErrorMessage());
            const event = new ChannelEvent(ChannelEventType.PeerDisconnected, channel);
            const transition = sut.createDisconnectedAbandon();

            // act
            const result = await transition(event);

            // assert
            expect(result).to.equal(ChannelStateId.Channel_Abandoned);
            expect(logic.sendMessage.called).to.equal(false);
        });
    });
});
