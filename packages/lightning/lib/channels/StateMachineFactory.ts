import { ILogger } from "@node-lightning/logger";
import { IChannelLogic } from "./IChannelLogic";
import { StateMachine } from "./StateMachine";
import { ChannelState } from "./states/ChannelState";
import { FailingState } from "./states/FailingState";
import { NormalState } from "./states/NormalState";
import { AwaitingAcceptChannelState } from "./states/opening/AwaitingAcceptChannelState";
import { AwaitingChannelReadyState } from "./states/opening/AwaitingChannelReadyState";
import { AwaitingFundingDepthState } from "./states/opening/AwaitingFundingDepthState";
import { AwaitingFundingSignedState } from "./states/opening/AwaitingFundingSignedState";
import { OpeningState } from "./states/opening/OpeningState";

export class StateMachineFactory {
    constructor(readonly logger: ILogger, readonly logic: IChannelLogic) {}

    public construct(): StateMachine {
        return new ChannelState(this.logger, this.logic)
            .addSubState(
                new OpeningState(this.logger, this.logic)
                    .addSubState(new AwaitingAcceptChannelState(this.logger, this.logic))
                    .addSubState(new AwaitingFundingSignedState(this.logger, this.logic))
                    .addSubState(new AwaitingFundingDepthState(this.logger, this.logic))
                    .addSubState(new AwaitingChannelReadyState(this.logger, this.logic)),
            )
            .addSubState(new NormalState(this.logger, this.logic))
            .addSubState(new FailingState(this.logger, this.logic));
    }
}
