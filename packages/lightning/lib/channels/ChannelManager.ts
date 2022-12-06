import { Network } from "@node-lightning/bitcoin";
import { Channel } from "./Channel";
import { IChannelStorage } from "./IChannelStorage";
import { ILogger } from "@node-lightning/logger";
import { StateMachine } from "./StateMachine";
import { IChannelLogic } from "./IChannelLogic";

/**
 *
 */
export class ChannelManager {
    public channels: Channel[] = [];

    constructor(
        readonly logger: ILogger,
        readonly network: Network,
        readonly logic: IChannelLogic,
        readonly channelStorage: IChannelStorage,
        public rootState: StateMachine,
    ) {}

    /**
     * Finds a channel by `temporaryChannelId`
     * @param tempId
     * @returns
     */
    public findChannelByTempId(peerId: string, tempId: Buffer): Channel | undefined {
        return this.channels.find(p => p.peerId === peerId && p.temporaryId.equals(tempId));
    }

    /**
     * Finds the state using breadth first search from the start state.
     * Because this a HSM, this will execute in the total number of
     * states in the system. Note this requires that the same state
     * cannot be a substate of two different parent states.
     * @param name
     * @returns
     */
    public findState(name: string): StateMachine {
        const queue: StateMachine[] = [];
        queue.push(this.rootState);
        while (queue.length) {
            const current = queue.shift();
            if (current.constructor.name === name) {
                return current;
            }

            queue.push(...current.subStates.values());
        }
    }

    /**
     * Transitions to a new state if a new state exists. This function
     * ensures that a few things happen during a state transition:
     *
     * 1. The `onExit` method of the existing state is fired
     * 2. The new state is assigned to the channel
     * 3. The `onEnter` method is fired for the new state
     * 4. The `channel is saved
     *
     * We run this in a loop until there are no state transitions.
     * @param channel
     * @param newStateName
     */
    public async transitionState(channel: Channel, newStateName: string): Promise<void> {
        let oldState = channel.state ?? this.rootState;

        // process until state stops changing
        while (newStateName && newStateName !== oldState.constructor.name) {
            const newState = this.findState(newStateName);

            // exit for old state
            await channel.state.onExit(channel, newState);

            // set the new state
            channel.state = newState;

            // entry for new state
            newStateName = await newState.onEnter(channel, oldState);

            // save the new state
            await this.channelStorage.save(channel);

            // mark the old state as the new state incase onEnter needs us
            // to transition
            oldState = newState;
        }
    }
}
