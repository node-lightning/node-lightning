import { Block, Network } from "@node-lightning/bitcoin";
import { Channel } from "./Channel";
import { ChannelId } from "../domain/ChannelId";
import { IChannelStorage } from "./IChannelStorage";
import { ILogger } from "@node-lightning/logger";
import { IChannelLogic } from "./IChannelLogic";
import { IPeer } from "../Peer";
import { Result } from "../Result";
import { OpenChannelRequest } from "./OpenChannelRequest";
import { OpeningError } from "./states/opening/OpeningError";
import { OpeningErrorType } from "./states/opening/OpeningErrorType";
import { AwaitingAcceptChannelState } from "./states/opening/AwaitingAcceptChannelState";
import { PeerState } from "../PeerState";
import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { IStateMachine } from "./IStateMachine";
import { FundingSignedMessage } from "../messages/FundingSignedMessage";
import { ChannelReadyMessage } from "../messages/ChannelReadyMessage";

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
        public rootState: IStateMachine,
    ) {}

    public findChannelById(channelId: ChannelId): Channel | undefined {
        return this.channels.find(p => channelId.equals(p.channelId));
    }

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
    public findState(name: string): IStateMachine {
        const queue: IStateMachine[] = [];
        queue.push(this.rootState);
        while (queue.length) {
            const current = queue.shift();
            if (current.name === name) {
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
        while (newStateName && newStateName !== oldState.name) {
            const newState = this.findState(newStateName);

            // exit for old state
            await oldState.onExit(channel, newState);

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

    /**
     * Transition #1. Performs the user controlled function of opening a
     * channel. If channel creation is successful then we transition to
     * the channel's first state.
     * @param peer
     * @param request
     * @returns
     */
    public async openChannel(
        peer: IPeer,
        request: OpenChannelRequest,
    ): Promise<Result<Channel, OpeningError>> {
        // Ensure peer is connected
        if (peer.state !== PeerState.Ready) {
            return Result.err(new OpeningError(OpeningErrorType.PeerNotReady));
        }

        // Build channel from the data
        const result = await this.logic.createChannel(this.network, request);
        if (!result.isOk) return result;

        // We now have a channel we can do stuff with
        const channel = result.value;

        // Create the open_channel message
        const message = await this.logic.createOpenChannelMessage(channel);

        // Send open_channel to the peer
        peer.sendMessage(message);

        // Save the initial state
        await this.transitionState(channel, AwaitingAcceptChannelState.name);

        // Return true result with the channel
        return Result.ok(channel);
    }

    /**
     * Processes an `accept_channel` message.
     * @param peer
     * @param msg
     * @returns
     */
    public async onAcceptChannelMessage(peer: IPeer, msg: AcceptChannelMessage): Promise<void> {
        const channel = this.findChannelByTempId(peer.id, msg.temporaryChannelId);
        if (!channel) {
            return;
        }
        const newState = await channel.state.onAcceptChannelMessage(channel, msg);
        await this.transitionState(channel, newState);
    }

    /**
     * Processes a `funding_signed` message
     * @param peer
     * @param msg
     */
    public async onFundingSignedMessage(peer: IPeer, msg: FundingSignedMessage): Promise<void> {
        const channel = this.findChannelById(msg.channelId);
        if (!channel) {
            return;
        }
        const newState = await channel.state.onFundingSignedMessage(channel, msg);
        await this.transitionState(channel, newState);
    }

    /**
     * Processes a connected block for all open channel
     * @param block
     */
    public async onBlockConnected(block: Block): Promise<void> {
        for (const channel of this.channels) {
            const newState = await channel.state.onBlockConnected(channel, block);
            await this.transitionState(channel, newState);
        }
    }

    /**
     * Processes a `channel_ready` message
     * @param peer
     * @param msg
     */
    public async onChannelReadyMessage(peer: IPeer, msg: ChannelReadyMessage) {
        const channel = this.findChannelById(msg.channelId);
        if (!channel) {
            return;
        }
        const newState = await channel.state.onChannelReadyMessage(channel, msg);
        await this.transitionState(channel, newState);
    }
}
