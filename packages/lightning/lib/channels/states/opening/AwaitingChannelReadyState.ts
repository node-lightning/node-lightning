import { ChannelReadyMessage } from "../../../messages/ChannelReadyMessage";
import { Channel } from "../../Channel";
import { StateMachine } from "../../StateMachine";
import { FailingState } from "../FailingState";
import { NormalState } from "../NormalState";

export class AwaitingChannelReadyState extends StateMachine {
    // eslint-disable-next-line @typescript-eslint/require-await
    public async onChannelReadyMessage(
        channel: Channel,
        msg: ChannelReadyMessage,
    ): Promise<string> {
        // validate the message
        const isOk = this.logic.validateChannelReadyMessage(channel, msg);

        // fail if not ok which will transition to a local unilateral close
        if (!isOk) {
            this.logger.warn("validating channel_ready message failed");
            return FailingState.name;
        }

        // attach the next_per_commitment_point
        channel.attachChannelReady(msg);

        // transition to normal operation
        return NormalState.name;
    }
}
