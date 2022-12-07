import { ILogger } from "@node-lightning/logger";
import { IChannelLogic } from "./IChannelLogic";
import { StateMachine } from "./StateMachine";
import { ChannelState } from "./states/ChannelState";
import { AwaitingAcceptChannelState } from "./states/opening/AwaitingAcceptChannelState";
import { OpeningState } from "./states/opening/OpeningState";

export class StateMachineFactory {
    constructor(readonly logger: ILogger, readonly logic: IChannelLogic) {}

    public construct(): StateMachine {
        return new ChannelState(this.logger, this.logic).addSubState(
            new OpeningState(this.logger, this.logic).addSubState(
                new AwaitingAcceptChannelState(this.logger, this.logic),
            ),
        );
    }
}
