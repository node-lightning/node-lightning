import { Channel } from "./Channel";
import { ChannelEvent } from "./ChannelEvent";
import { TransitionResult } from "./TransitionResult";

export interface IStateMachine {
    id: string;
    name: string;
    subStates: Map<string, IStateMachine>;
    parent: IStateMachine | undefined;

    addSubState(state: IStateMachine): IStateMachine;
    onEnter(channel: Channel, event: ChannelEvent): Promise<TransitionResult>;
    onExit(channel: Channel, event: ChannelEvent): Promise<TransitionResult>;
    onEvent(channel: Channel, event: ChannelEvent): Promise<TransitionResult>;
}
