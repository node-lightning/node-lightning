import { ILogger } from "@node-lightning/logger";
import { expect } from "chai";
import { Channel } from "../../../lib/channels/Channel";
import { IChannelLogic } from "../../../lib/channels/IChannelLogic";
import { FailingState } from "../../../lib/channels/states/FailingState";
import { AwaitingChannelReadyState } from "../../../lib/channels/states/opening/AwaitingChannelReadyState";
import { AwaitingFundingDepthState } from "../../../lib/channels/states/opening/AwaitingFundingDepthState";
import {
    createFakeLogger,
    createFakeChannelLogicFacade,
    createFakeChannel,
    createFakeAcceptChannel,
    createFakeFundingTx,
    createFakeFundingSignedMessage,
    createFakeChannelReady,
} from "../../_test-utils";

describe(AwaitingChannelReadyState.name, () => {
    describe(AwaitingChannelReadyState.prototype.onChannelReadyMessage.name, () => {
        let logger: ILogger;
        let logic: sinon.SinonStubbedInstance<IChannelLogic>;
        let sut: AwaitingChannelReadyState;
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

        it("transitions Failed when invalid", async () => {
            // arrange
            const msg = createFakeChannelReady();
            logic.validateChannelReadyMessage.returns(false);

            // act
            const result = await sut.onChannelReadyMessage(channel, msg);

            // assert
            expect(result).to.equal(FailingState.name);
        });

        it("attaches next_per_commitment_point + stays", async () => {
            // arrange
            const msg = createFakeChannelReady();
            logic.validateChannelReadyMessage.returns(true);

            // act
            const result = await sut.onChannelReadyMessage(channel, msg);
            expect(result).to.equal(AwaitingFundingDepthState.name);
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
