/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { ILogger } from "@node-lightning/logger";
import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { FundingSignedMessage } from "../messages/FundingSignedMessage";
import { ShutdownMessage } from "../messages/ShutdownMessage";
import { IPeer } from "../Peer";

import { Channel } from "./Channel";
import { Helpers } from "./Helpers";
import { IChannelLogic } from "./IChannelLogic";

export abstract class StateMachine {
    public logger: ILogger;

    public parent: StateMachine | undefined;
    public subStates: Map<string, StateMachine> = new Map();

    public get stack(): StateMachine[] {
        const result: StateMachine[] = [];
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let current: StateMachine = this;
        while (current !== undefined) {
            result.push(current);
            current = current.parent;
        }
        return result.reverse();
    }

    public constructor(logger: ILogger, readonly logic: IChannelLogic) {
        this.logger = logger.sub(StateMachine.name);
    }

    public addSubState(state: StateMachine): this {
        state.parent = this;
        this.subStates.set(state.constructor.name, state);
        return this;
    }

    public async onEnter(channel: Channel, oldState: StateMachine): Promise<string> {
        return undefined;
    }

    public async onExit(channel: Channel, newState: StateMachine): Promise<string> {
        return undefined;
    }

    public async onPeerConnected(peer: IPeer, channel: Channel): Promise<string> {
        return undefined;
    }

    public async onPeerDisconnected(peer: IPeer, channel: Channel): Promise<string> {
        return undefined;
    }

    public async openChannel(channel: Channel, peer: IPeer): Promise<string> {
        return undefined;
    }

    public async onAcceptChannelMessage(
        channel: Channel,
        peer: IPeer,
        msg: AcceptChannelMessage,
    ): Promise<string> {
        return undefined;
    }

    public async onShutdownMessage(
        channel: Channel,
        peer: IPeer,
        msg: ShutdownMessage,
    ): Promise<string> {
        return undefined;
    }

    public async onFundingSignedMessage(
        channel: Channel,
        peer: IPeer,
        msg: FundingSignedMessage,
    ): Promise<string> {
        return undefined;
    }
}
