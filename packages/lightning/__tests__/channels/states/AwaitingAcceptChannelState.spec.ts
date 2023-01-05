import { TxBuilder, Value } from "@node-lightning/bitcoin";
import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import { IWireMessage } from "../../../lib";
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

                // act
                const result = await sut.onAcceptChannelMessage(channel, msg);

                // assert
                expect(result).to.equal(FailingState.name);
            });
        });

        describe("valid message", () => {
            let msg: AcceptChannelMessage;
            let sig: Buffer;

            beforeEach(() => {
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
                await sut.onAcceptChannelMessage(channel, msg);

                // assert
                expect(channel.theirSide.fundingPubKey).to.not.equal(undefined);
            });

            it("attaches funding tx to channel", async () => {
                // arrange
                expect(channel.fundingTx).to.equal(undefined);

                // act
                await sut.onAcceptChannelMessage(channel, msg);

                // assert
                expect(channel.fundingTx).to.not.equal(undefined);
            });

            it("sends create_funding message to peer", async () => {
                // act
                await sut.onAcceptChannelMessage(channel, msg);

                // assert
                expect(logic.sendMessage.called).to.equal(true);
                expect(logic.sendMessage.args[0][0]).to.equal(channel.peerId);
                expect((logic.sendMessage.args[0][1] as IWireMessage).type).to.equal(
                    FundingCreatedMessage.type,
                );
            });

            it("transitions to awaiting_funding_signed", async () => {
                // act
                const result = await sut.onAcceptChannelMessage(channel, msg);

                // assert
                expect(result).to.equal(AwaitingFundingSignedState.name);
            });
        });
    });
});
