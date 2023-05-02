import { ChannelEvent } from "./ChannelEvent";
import { ChannelEventType } from "./ChannelEventType";
import { TransitionFn } from "./TransitionFn";
import { TransitionResult } from "./TransitionResult";

export interface IStateMachine {
    id: string;
    name: string;
    subStates: Map<string, IStateMachine>;
    parent: IStateMachine | undefined;

    handlesEvent(type: ChannelEventType): boolean;
    getTransitions(type: ChannelEventType): TransitionFn;

    addSubState(state: IStateMachine): IStateMachine;
    onEnter(event: ChannelEvent): Promise<TransitionResult>;
    onExit(event: ChannelEvent): Promise<TransitionResult>;
    onEvent(event: ChannelEvent): Promise<TransitionResult>;
}
