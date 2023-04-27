import { Block, Network } from "@node-lightning/bitcoin";
import { Channel } from "./Channel";
import { ChannelId } from "../domain/ChannelId";
import { IChannelStorage } from "./IChannelStorage";
import { ILogger } from "@node-lightning/logger";
import { IChannelLogic } from "./IChannelLogic";
import { IPeer } from "../Peer";
import { Result } from "../Result";
import { OpenChannelRequest } from "./OpenChannelRequest";
import { OpeningError } from "./OpeningError";
import { OpeningErrorType } from "./OpeningErrorType";
import { PeerState } from "../PeerState";
import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { IStateMachine } from "./IStateMachine";
import { FundingSignedMessage } from "../messages/FundingSignedMessage";
import { ChannelReadyMessage } from "../messages/ChannelReadyMessage";
import { ChannelStateId } from "./StateMachineFactory";
import { ChannelEvent } from "./ChannelEvent";
import { ChannelEventType } from "./ChannelEventType";

/**
 *
 */
export class ChannelManager {
    public channels: Channel[] = [];
    public logger: ILogger;

    constructor(
        logger: ILogger,
        readonly network: Network,
        readonly logic: IChannelLogic,
        readonly channelStorage: IChannelStorage,
        public rootState: IStateMachine,
    ) {
        this.logger = logger.sub(ChannelManager.name);
    }

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
    public findState(id: string): IStateMachine {
        const queue: IStateMachine[] = [];
        queue.push(this.rootState);
        while (queue.length) {
            const current = queue.shift();
            this.logger.trace("target", id, "current", current.id);
            if (current.id === id) {
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
     * @param newId
     */
    public async transitionState(
        channel: Channel,
        event: ChannelEvent,
        newId: string,
    ): Promise<void> {
        let oldState = channel.state ?? this.rootState;

        // process until state stops changing
        while (newId && newId !== oldState.id) {
            const newState = this.findState(newId);

            if (!newState) {
                // TODO - this isn't being handled anywhere... channel manager needs to do some stuff
                this.logger.error("Failed to find state, state=" + newId);
                throw new Error("Failed to find state, state=" + newId);
            }

            // exit for old state
            await oldState.onExit(channel, event);

            // set the new state
            channel.state = newState;

            // entry for new state
            newId = await newState.onEnter(channel, event);

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
        this.logic.sendMessage(peer.id, message);

        // Save the initial state
        await this.transitionState(
            channel,
            undefined,
            ChannelStateId.Channel_Initializing_AwaitingAcceptChannel,
        );

        // Add to channels
        this.channels.push(channel);

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
        this.logger.debug("handling", msg);
        const channel = this.findChannelByTempId(peer.id, msg.temporaryChannelId);
        if (!channel) {
            this.logger.debug("failed to find channel");
            return;
        }

        const event = new ChannelEvent(ChannelEventType.AcceptChannelMessage);
        event.message = msg;
        const newState = await channel.state.onEvent(channel, event);
        await this.transitionState(channel, event, newState);
    }

    /**
     * Processes a `funding_signed` message
     * @param peer
     * @param msg
     */
    public async onFundingSignedMessage(peer: IPeer, msg: FundingSignedMessage): Promise<void> {
        this.logger.debug("handling", msg);
        const channel = this.findChannelById(msg.channelId);
        if (!channel) {
            this.logger.debug("failed to find channel");
            return;
        }
        const event = new ChannelEvent(ChannelEventType.FundingSignedMessage);
        event.message = msg;
        const newState = await channel.state.onEvent(channel, event);
        await this.transitionState(channel, event, newState);
    }

    /**
     * Processes a connected block for all open channel
     * @param block
     */
    public async onBlockConnected(block: Block): Promise<void> {
        this.logger.debug("connecting block", block.bip34Height);
        const event = new ChannelEvent(ChannelEventType.BlockConnected);
        event.block = block;
        for (const channel of this.channels) {
            const newState = await channel.state.onEvent(channel, event);
            await this.transitionState(channel, event, newState);
        }
    }

    /**
     * Processes a `channel_ready` message
     * @param peer
     * @param msg
     */
    public async onChannelReadyMessage(peer: IPeer, msg: ChannelReadyMessage) {
        this.logger.debug("handling", msg);
        const channel = this.findChannelById(msg.channelId);
        if (!channel) {
            return;
        }
        const event = new ChannelEvent(ChannelEventType.ChannelReadyMessage);
        event.message = msg;
        const newState = await channel.state.onEvent(channel, event);
        await this.transitionState(channel, event, newState);
    }
}
