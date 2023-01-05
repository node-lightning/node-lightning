import { Block } from "@node-lightning/bitcoin";
import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { FundingLockedMessage } from "../messages/FundingLockedMessage";
import { FundingSignedMessage } from "../messages/FundingSignedMessage";
import { Channel } from "./Channel";

export interface IStateMachine {
    name: string;
    subStates: Map<string, IStateMachine>;
    parent: IStateMachine | undefined;

    addSubState(state: IStateMachine): IStateMachine;
    onEnter(channel: Channel, oldState: IStateMachine): Promise<string>;
    onExit(channel: Channel, newState: IStateMachine): Promise<string>;
    onPeerConnected(channel: Channel): Promise<string>;
    onPeerDisconnected(channel: Channel): Promise<string>;
    onAcceptChannelMessage(channel: Channel, msg: AcceptChannelMessage): Promise<string>;
    onFundingSignedMessage(channel: Channel, msg: FundingSignedMessage): Promise<string>;
    onChannelReadyMessage(channel: Channel, msg: FundingLockedMessage): Promise<string>;
    onBlockConnected(channel: Channel, block: Block): Promise<string>;
}
