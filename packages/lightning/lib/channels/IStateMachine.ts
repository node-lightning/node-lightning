import { Channel } from "./Channel";
import { ChannelEvent } from "./ChannelEvent";
import { ChannelStateId } from "./StateMachineFactory";

export interface IStateMachine {
    id: string;
    name: string;
    subStates: Map<string, IStateMachine>;
    parent: IStateMachine | undefined;

    addSubState(state: IStateMachine): IStateMachine;
    onEnter(channel: Channel, oldState: IStateMachine): Promise<string>;
    onExit(channel: Channel, newState: IStateMachine): Promise<string>;
    onEvent(channel: Channel, event: ChannelEvent): Promise<ChannelStateId | undefined>;
}
