/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { Block } from "@node-lightning/bitcoin";
import { ILogger } from "@node-lightning/logger";
import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { FundingLockedMessage } from "../messages/FundingLockedMessage";
import { FundingSignedMessage } from "../messages/FundingSignedMessage";
import { ShutdownMessage } from "../messages/ShutdownMessage";
import { IPeer } from "../Peer";

import { Channel } from "./Channel";
import { IChannelLogic } from "./IChannelLogic";
import { IStateMachine } from "./IStateMachine";

export abstract class StateMachine {
    public logger: ILogger;

    public parent: StateMachine | undefined;
    public subStates: Map<string, IStateMachine> = new Map();

    public get stack(): IStateMachine[] {
        const result: StateMachine[] = [];
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let current: StateMachine = this;
        while (current !== undefined) {
            result.push(current);
            current = current.parent;
        }
        return result.reverse();
    }

    public get name(): string {
        return this.constructor.name;
    }

    public constructor(logger: ILogger, readonly logic: IChannelLogic) {
        this.logger = logger.sub(StateMachine.name);
    }

    public addSubState(state: IStateMachine): this {
        state.parent = this;
        this.subStates.set(state.constructor.name, state);
        return this;
    }

    public async onEnter(channel: Channel, oldState: IStateMachine): Promise<string> {
        return undefined;
    }

    public async onExit(channel: Channel, newState: IStateMachine): Promise<string> {
        return undefined;
    }

    public async onPeerConnected(channel: Channel): Promise<string> {
        return undefined;
    }

    public async onPeerDisconnected(channel: Channel): Promise<string> {
        return undefined;
    }

    public async openChannel(channel: Channel): Promise<string> {
        return undefined;
    }

    public async onAcceptChannelMessage(
        channel: Channel,
        msg: AcceptChannelMessage,
    ): Promise<string> {
        return undefined;
    }

    public async onShutdownMessage(channel: Channel, msg: ShutdownMessage): Promise<string> {
        return undefined;
    }

    public async onFundingSignedMessage(
        channel: Channel,
        msg: FundingSignedMessage,
    ): Promise<string> {
        return undefined;
    }

    public async onBlockConnected(channel: Channel, block: Block): Promise<string> {
        return undefined;
    }

    public async onChannelReadyMessage(
        channel: Channel,
        msg: FundingLockedMessage,
    ): Promise<string> {
        return undefined;
    }
}
