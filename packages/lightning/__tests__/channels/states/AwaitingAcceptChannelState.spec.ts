import { TxBuilder, Value } from "@node-lightning/bitcoin";
import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import { IPeer, IWireMessage } from "../../../lib";
import { Channel } from "../../../lib/channels/Channel";
import { IChannelLogic } from "../../../lib/channels/IChannelLogic";
import { FailingState } from "../../../lib/channels/states/FailingState";
import { AwaitingAcceptChannelState } from "../../../lib/channels/states/opening/AwaitingAcceptChannelState";
import { AwaitingFundingSignedState } from "../../../lib/channels/states/opening/AwaitingFundingSignedState";
import { OpeningError } from "../../../lib/channels/states/opening/OpeningError";
import { OpeningErrorType } from "../../../lib/channels/states/opening/OpeningErrorType";
import { AcceptChannelMessage } from "../../../lib/messages/AcceptChannelMessage";
import { FundingCreatedMessage } from "../../../lib/messages/FundingCreatedMessage";
import { Result } from "../../../lib/Result";
import {
    createFakeAcceptChannel,
    createFakeChannel,
    createFakeChannelLogicFacade,
    createFakeFundingCreatedMessage,
    createFakeFundingTx,
    createFakeLogger,
    createFakePeer,
    FakePeer,
} from "../../_test-utils";

describe(AwaitingAcceptChannelState.name, () => {
    describe(AwaitingAcceptChannelState.prototype.onAcceptChannelMessage.name, () => {
        let logger: ILogger;
        let logic: sinon.SinonStubbedInstance<IChannelLogic>;
        let sut: AwaitingAcceptChannelState;
        let channel: Channel;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            sut = new AwaitingAcceptChannelState(logger, logic);
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
                const peer = createFakePeer();

                // act
                const result = await sut.onAcceptChannelMessage(channel, peer, msg);

                // assert
                expect(result).to.equal(FailingState.name);
            });
        });

        describe("valid message", () => {
            let peer: FakePeer;
            let msg: AcceptChannelMessage;
            let sig: Buffer;

            beforeEach(() => {
                peer = createFakePeer();
                msg = createFakeAcceptChannel();
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
                await sut.onAcceptChannelMessage(channel, peer, msg);

                // assert
                expect(channel.theirSide.fundingPubKey).to.not.equal(undefined);
            });

            it("attaches funding tx to channel", async () => {
                // arrange
                expect(channel.fundingTx).to.equal(undefined);

                // act
                await sut.onAcceptChannelMessage(channel, peer, msg);

                // assert
                expect(channel.fundingTx).to.not.equal(undefined);
            });

            it("sends create_funding message to peer", () => {
                // assert
                peer.on("readable", () => {
                    const msg = peer.read() as IWireMessage;
                    expect(msg.type).to.equal(FundingCreatedMessage.type);
                });

                // act
                void sut.onAcceptChannelMessage(channel, peer, msg);
            });

            it("transitions to awaiting_funding_signed", async () => {
                // act
                const result = await sut.onAcceptChannelMessage(channel, peer, msg);

                // assert
                expect(result).to.equal(AwaitingFundingSignedState.name);
            });
        });
    });
});
