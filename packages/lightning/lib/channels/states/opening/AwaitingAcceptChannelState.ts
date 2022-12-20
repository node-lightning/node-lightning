import { AcceptChannelMessage } from "../../../messages/AcceptChannelMessage";
import { IPeer } from "../../../Peer";
import { Channel } from "../../Channel";
import { StateMachine } from "../../StateMachine";
import { FailingState } from "../FailingState";
import { AwaitingFundingSignedState } from "./AwaitingFundingSignedState";
import { OpeningErrorType } from "./OpeningErrorType";

export class AwaitingAcceptChannelState extends StateMachine {
    public async onAcceptChannelMessage(
        channel: Channel,
        peer: IPeer,
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
        channel.attachFundingTx(await this.logic.createFundingTx(channel));

        // create the ctx
        const [ctx] = await this.logic.createRemoteCommitmentTx(channel);

        // sign the ctx
        const sig = await this.logic.signCommitmentTx(channel, ctx);

        // create funding_created message
        const fundingCreatedMessage = await this.logic.createFundingCreatedMessage(channel, sig);

        // send message to the peer
        peer.sendMessage(fundingCreatedMessage);

        // return new state
        return AwaitingFundingSignedState.name;
    }
}
