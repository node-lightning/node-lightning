import { AcceptChannelMessage } from "../../../messages/AcceptChannelMessage";
import { Channel } from "../../Channel";
import { StateMachine } from "../../StateMachine";
import { FailingState } from "../FailingState";
import { AwaitingFundingSignedState } from "./AwaitingFundingSignedState";

export class AwaitingAcceptChannelState extends StateMachine {
    public async onAcceptChannelMessage(
        channel: Channel,
        msg: AcceptChannelMessage,
    ): Promise<string> {
        this.logger.debug("processing accept_channel message", msg);

        // validate the message
        const ok = await this.logic.validateAcceptChannel(channel, msg);
        if (ok.isErr) {
            this.logger.warn("accept_channel validation failed: ", ok.error.message);
            return FailingState.name;
        }

        // attach message props from message to channel
        channel.attachAcceptChannel(msg);

        // construct funding transaction
        const fundingTx = await this.logic.createFundingTx(channel);

        // attaching funding transaction to channel
        channel.attachFundingTx(fundingTx);

        // create the ctx
        const [ctx] = await this.logic.createRemoteCommitmentTx(channel);

        // sign the ctx
        const sig = await this.logic.signCommitmentTx(channel, ctx);

        // create funding_created message
        const fundingCreatedMessage = await this.logic.createFundingCreatedMessage(channel, sig);

        // send message to the peer
        await this.logic.sendMessage(channel.peerId, fundingCreatedMessage);

        // return new state
        return AwaitingFundingSignedState.name;
    }
}
