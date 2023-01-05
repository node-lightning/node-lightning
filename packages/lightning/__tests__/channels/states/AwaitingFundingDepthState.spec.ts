import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import { Channel } from "../../../lib/channels/Channel";
import { IChannelLogic } from "../../../lib/channels/IChannelLogic";
import { NormalState } from "../../../lib/channels/states/NormalState";
import { AwaitingChannelReadyState } from "../../../lib/channels/states/opening/AwaitingChannelReadyState";
import { AwaitingFundingDepthState } from "../../../lib/channels/states/opening/AwaitingFundingDepthState";
import {
    createFakeLogger,
    createFakeChannelLogicFacade,
    createFakeChannel,
    createFakeAcceptChannel,
    createFakeFundingTx,
    createFakeFundingSignedMessage,
    createFakeBlock,
    createFakeChannelReady,
} from "../../_test-utils";

describe(AwaitingFundingDepthState.name, () => {
    describe(AwaitingFundingDepthState.prototype.onBlockConnected.name, () => {
        let logger: ILogger;
        let logic: sinon.SinonStubbedInstance<IChannelLogic>;
        let sut: AwaitingFundingDepthState;
        let channel: Channel;

        beforeEach(() => {
            logger = createFakeLogger();
            logic = createFakeChannelLogicFacade();
            sut = new AwaitingFundingDepthState(logger, logic);
            channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage());
        });

        it("not confirmed => stays", async () => {
            // arrange
            const block = createFakeBlock();

            // act
            const result = await sut.onBlockConnected(channel, block);

            // assert
            expect(channel.fundingConfirmedHeight).to.equal(undefined);
            expect(result).to.equal(AwaitingFundingDepthState.name);
        });

        it("confirmed => attaches height, stays", async () => {
            // arrange
            const fundingTx = createFakeFundingTx();
            const block = createFakeBlock(500_000, fundingTx);

            // act
            const result = await sut.onBlockConnected(channel, block);

            // assert
            expect(channel.fundingConfirmedHeight).to.equal(500_000);
            expect(channel.readyHeight).to.equal(500_006);
            expect(result).to.equal(AwaitingFundingDepthState.name);
        });

        it("confirmed + height => stays", async () => {
            // arrange
            channel.markConfirmed(500_000);
            const block = createFakeBlock(500_001);

            // act
            const result = await sut.onBlockConnected(channel, block);

            // assert
            expect(channel.fundingConfirmedHeight).to.equal(500_000);
            expect(channel.readyHeight).to.equal(500_006);
            expect(result).to.equal(AwaitingFundingDepthState.name);
        });

        it("meets depth, no channel_ready => sends channel_ready + transitions to awaiting_channel_ready", async () => {
            // arrange
            channel.markConfirmed(500_000);
            const block = createFakeBlock(500_006);

            // act
            const result = await sut.onBlockConnected(channel, block);

            // assert
            expect(result).to.equal(AwaitingChannelReadyState.name);
            expect(logic.sendMessage.called).to.equal(true);
        });

        it("meets depth + has channel_ready => sends channel_ready + transitions to normal", async () => {
            // arrange
            channel.markConfirmed(500_000);
            channel.attachChannelReady(createFakeChannelReady());

            const block = createFakeBlock(500_006);

            // act
            const result = await sut.onBlockConnected(channel, block);

            // assert
            expect(result).to.equal(NormalState.name);
            expect(logic.sendMessage.called).to.equal(true); // arrange
        });
    });
});
