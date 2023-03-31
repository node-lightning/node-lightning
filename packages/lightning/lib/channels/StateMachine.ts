/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { ILogger } from "@node-lightning/logger";

import { Channel } from "./Channel";
import { ChannelEvent } from "./ChannelEvent";
import { ChannelEventType } from "./ChannelEventType";
import { IStateMachine } from "./IStateMachine";
import { ChannelStateId } from "./StateMachineFactory";

export class StateMachine implements IStateMachine {
    public logger: ILogger;

    public parent: IStateMachine | undefined;
    public subStates: Map<string, IStateMachine> = new Map();
    public transitions: Map<
        ChannelEventType,
        (channel: Channel, event: ChannelEvent) => Promise<ChannelStateId | undefined>
    > = new Map();

    public get stack(): IStateMachine[] {
        const result: IStateMachine[] = [];
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let current: IStateMachine = this;
        while (current !== undefined) {
            result.push(current);
            current = current.parent;
        }
        return result.reverse();
    }

    public get id(): string {
        if (this.parent) {
            return this.parent.id + "." + this.name;
        }
        return this.name;
    }

    public constructor(logger: ILogger, readonly name: string) {
        this.logger = logger.sub(StateMachine.name);
    }

    public addSubState(state: IStateMachine): this {
        state.parent = this;
        this.subStates.set(state.id, state);
        return this;
    }

    public async onEnter(channel: Channel, oldState: IStateMachine): Promise<string> {
        this.logger.debug("Entering", this.name);
        return undefined;
    }

    public async onExit(channel: Channel, newState: IStateMachine): Promise<string> {
        this.logger.debug("Exiting", this.name);
        return undefined;
    }

    public addTransition(
        type: ChannelEventType,
        handler: (channel: Channel, event: ChannelEvent) => Promise<ChannelStateId | undefined>,
    ) {
        this.transitions.set(type, handler);
        return this;
    }

    public async onEvent(
        channel: Channel,
        event: ChannelEvent,
    ): Promise<ChannelStateId | undefined> {
        if (!this.transitions.has(event.type)) return;
        return this.transitions.get(event.type)(channel, event);
    }
}
