import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { IPeer } from "../Peer";
import { Channel } from "./Channel";

export interface IStateMachine {
    name: string;
    subStates: Map<string, IStateMachine>;
    parent: IStateMachine | undefined;

    addSubState(state: IStateMachine): IStateMachine;
    onEnter(channel: Channel, oldState: IStateMachine): Promise<string>;
    onExit(channel: Channel, newState: IStateMachine): Promise<string>;
    onPeerConnected(peer: IPeer, channel: Channel): Promise<string>;
    onPeerDisconnected(peer: IPeer, channel: Channel): Promise<string>;
    onAcceptChannelMessage(
        channel: Channel,
        peer: IPeer,
        msg: AcceptChannelMessage,
    ): Promise<string>;
}
