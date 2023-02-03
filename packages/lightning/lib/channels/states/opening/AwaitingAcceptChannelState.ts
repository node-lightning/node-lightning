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
        this.logger.debug("funding tx", fundingTx);

        // attaching funding transaction to channel
        channel.attachFundingTx(fundingTx);

        // create the ctx
        const [ctx] = await this.logic.createRemoteCommitmentTx(channel);
        this.logger.debug("remote ctx", ctx.toTx());

        // sign the ctx
        const sig = await this.logic.signCommitmentTx(channel, ctx);
        this.logger.debug("remote ctx sig", sig.toString("hex"));

        // create funding_created message
        const fundingCreatedMessage = await this.logic.createFundingCreatedMessage(channel, sig);
        this.logger.debug("sending funding_created", fundingCreatedMessage);

        // send message to the peer
        await this.logic.sendMessage(channel.peerId, fundingCreatedMessage);

        // return new state
        return AwaitingFundingSignedState.name;
    }
}
