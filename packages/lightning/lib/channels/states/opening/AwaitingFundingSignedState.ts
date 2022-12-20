import { FundingSignedMessage } from "../../../messages/FundingSignedMessage";
import { IPeer } from "../../../Peer";
import { Channel } from "../../Channel";
import { StateMachine } from "../../StateMachine";
import { FailingState } from "../FailingState";
import { AwaitingFundingDepthState } from "./AwaitingFundingDepthState";

export class AwaitingFundingSignedState extends StateMachine {
    public async onFundingSignedMessage(
        channel: Channel,
        peer: IPeer,
        msg: FundingSignedMessage,
    ): Promise<string> {
        // Validate the funding_signed message
        const msgOk = await this.logic.validateFundingSignedMessage(channel, msg);
        if (msgOk.isErr) {
            this.logger.warn("funding_signed validation failed: ", msgOk.error.message);
            return FailingState.name;
        }

        // Attach funding_signed information to channel
        channel.attachFundingSigned(msg);

        // Sign the funding transaction
        channel.fundingTx = await this.logic.signFundingTx(channel);

        // Broadcast funding transaction
        await this.logic.broadcastTx(channel.fundingTx);

        // Transition to AwaitingFundingDepth state
        return AwaitingFundingDepthState.name;
    }
}
