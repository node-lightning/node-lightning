import { Channel } from "./Channel";
import { ChannelEvent } from "./ChannelEvent";
import { TransitionResult } from "./TransitionResult";

export interface IStateMachine {
    id: string;
    name: string;
    subStates: Map<string, IStateMachine>;
    parent: IStateMachine | undefined;

    addSubState(state: IStateMachine): IStateMachine;
    onEnter(event: ChannelEvent): Promise<TransitionResult>;
    onExit(event: ChannelEvent): Promise<TransitionResult>;
    onEvent(event: ChannelEvent): Promise<TransitionResult>;
}
