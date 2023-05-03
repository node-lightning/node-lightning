/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { ILogger } from "@node-lightning/logger";

import { Channel } from "./Channel";
import { ChannelEvent } from "./ChannelEvent";
import { ChannelEventType } from "./ChannelEventType";
import { IStateMachine } from "./IStateMachine";
import { TransitionFn } from "./TransitionFn";
import { TransitionResult } from "./TransitionResult";

export class StateMachine implements IStateMachine {
    public logger: ILogger;

    public parent: IStateMachine | undefined;
    public subStates: Map<string, IStateMachine> = new Map();
    public transitions: Map<ChannelEventType, TransitionFn[]> = new Map();
    public enterFn: TransitionFn;
    public exitFn: TransitionFn;

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

    public handlesEvent(type: ChannelEventType): boolean {
        return this.transitions.has(type);
    }

    public getTransitions(type: ChannelEventType): TransitionFn[] {
        return this.transitions.get(type);
    }

    public addSubState(state: IStateMachine): this {
        state.parent = this;
        this.subStates.set(state.id, state);
        return this;
    }

    public addTransition(type: ChannelEventType, fn: TransitionFn): this {
        if (!this.transitions.has(type)) {
            this.transitions.set(type, []);
        }
        this.transitions.get(type).push(fn);
        return this;
    }

    public setEnterFn(fn: TransitionFn): this {
        this.enterFn = fn;
        return this;
    }

    public setExitFn(fn: TransitionFn): this {
        this.exitFn = fn;
        return this;
    }

    public async onEnter(event: ChannelEvent): Promise<TransitionResult> {
        this.logger.debug("Entering", this.name);
        return this.enterFn ? this.enterFn(event) : undefined;
    }

    public async onExit(event: ChannelEvent): Promise<TransitionResult> {
        this.logger.debug("Exiting", this.name);
        return this.exitFn ? this.exitFn(event) : undefined;
    }

    public async onEvent(event: ChannelEvent): Promise<TransitionResult> {
        // cascade up the hierarchy looking for a handler
        let current: IStateMachine = this as IStateMachine;
        if (current && !current.handlesEvent(event.type)) {
            current = this.parent;
        }
        if (!current) return;

        // execute transitions until one one handles the event
        const transitionFns = current.getTransitions(event.type);
        for (const transitionFn of transitionFns) {
            const result = await transitionFn(event);
            if (result) return result;
        }
    }
}
