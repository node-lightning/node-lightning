import { ILogger } from "@node-lightning/logger";
import { ChannelEventType } from "./ChannelEventType";
import { StateMachine } from "./StateMachine";
import { TransitionFactory } from "./TransitionFactory";

export enum ChannelStateId {
    Channel_Initializing_AwaitingAcceptChannel = "channel.initializing.awaiting_accept_channel",
    Channel_Initializing_AwaitingFundingSigned = "channel.initializing.awaiting_funding_signed",
    Channel_Funding_AwaitingFundingDepth = "channel.funding.awaiting_funding_depth",
    Channel_Funding_AwaitingChannelReady = "channel.funding.awaiting_channel_ready",
    Channel_Failing = "channel.failing",
    Channel_Normal = "channel.normal",
    Channel_Abandoned = "channel.abandoned",
}

export class StateMachineFactory {
    constructor(readonly logger: ILogger, readonly transitions: TransitionFactory) {}

    public construct(): StateMachine {
        return new StateMachine(this.logger, "channel")
            .addSubState(
                new StateMachine(this.logger, "initializing")
                    .addSubState(
                        new StateMachine(this.logger, "awaiting_accept_channel").addTransition(
                            ChannelEventType.AcceptChannelMessage,
                            this.transitions.createOnAcceptChannelMessageTransition(),
                        ),
                    )
                    .addSubState(
                        new StateMachine(this.logger, "awaiting_funding_signed").addTransition(
                            ChannelEventType.FundingSignedMessage,
                            this.transitions.createOnFundingSignedMessageTransition(),
                        ),
                    ),
            )
            .addSubState(
                new StateMachine(this.logger, "funding")
                    .addSubState(
                        new StateMachine(this.logger, "awaiting_funding_depth")
                            .addTransition(
                                ChannelEventType.BlockConnected,
                                this.transitions.createOnBlockConnected(),
                            )
                            .addTransition(
                                ChannelEventType.ChannelReadyMessage,
                                this.transitions.createOnChannelReadyTransition(
                                    ChannelStateId.Channel_Funding_AwaitingFundingDepth,
                                ),
                            ),
                    )
                    .addSubState(
                        new StateMachine(this.logger, "awaiting_channel_ready").addTransition(
                            ChannelEventType.ChannelReadyMessage,
                            this.transitions.createOnChannelReadyTransition(
                                ChannelStateId.Channel_Normal,
                            ),
                        ),
                    ),
            )
            .addSubState(new StateMachine(this.logger, "abandoned"))
            .addSubState(new StateMachine(this.logger, "failing"))
            .addSubState(new StateMachine(this.logger, "normal"));
    }
}
