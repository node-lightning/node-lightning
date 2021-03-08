import { ShortChannelId } from "@node-lightning/core";
import { ILogger } from "@node-lightning/logger";
import { ChannelUpdateChannelFlags } from "../flags/ChanneUpdateChannelFlags";
import { ChannelAnnouncementMessage } from "../messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "../messages/ChannelUpdateMessage";
import { IWireMessage } from "../messages/IWireMessage";
import { NodeAnnouncementMessage } from "../messages/NodeAnnouncementMessage";
import { IPeer } from "../Peer";

/**
 * Interface for the sub-system for handling the gossip message relay,
 * also known as rumor mongering.This system is responsible for
 * periodically flushing messages to connected peers and makes a best
 * effort to not send message that have already been sent to a peer.
 *
 * The idea of rumor mongering is that a piece of information is hot. A
 * node attempts to infect connected peers with this information by
 * sending it to them. Once it has been sent, we no longer need to
 * infect them with information.
 */
export interface IGossipRelay {
    /**
     * The current state of gossip relay
     */
    state: GossipRelayState;

    /**
     * Starts gossip relay
     */
    start(): void;

    /**
     * Stops gossip relay
     */
    stop(): void;

    /**
     * Adds a new peer to relay messages to
     * @param peer
     */
    addPeer(peer: IPeer): void;

    /**
     * Removes the peer from relay
     * @param peer
     */
    removePeer(peer: IPeer): void;

    /**
     * Enqueues a message to be broadcast to peers
     * @param msg
     */
    enqueue(msg: IWireMessage): void;
}

/**
 * The state of a IGossipRelay rumor mongerer
 */
export enum GossipRelayState {
    /**
     * Rumor mongering is not active
     */
    Inactive,

    /**
     * Rumor mongering is active
     */
    Active,
}

/**
 * This is a basic implementation of IGossipRelay that enques all
 * messages and maintaining an index of each peer in the queue. When
 * messages are flushed, only messages that haven't been sent to a peer
 * are sent and the index position for that peer is updated. When the
 * queue of messages has reached a maximum length, older messages are
 * pruned and the index positions are updated.
 */
export class GossipRelay {
    private _queue: IWireMessage[];
    private _peers: Map<IPeer, number>;
    private _timer: NodeJS.Timeout;
    private _state: GossipRelayState;

    constructor(
        readonly logger: ILogger,
        readonly relayPeriodMs = 60000,
        readonly maxQueueLen = 10000,
    ) {
        this._peers = new Map() as Map<IPeer, number>;
        this._queue = [];
        this._state = GossipRelayState.Inactive;
    }

    /**
     * Gets the current state of gossip relay
     */
    public get state(): GossipRelayState {
        return this._state;
    }

    /**
     * Starts relay to peers. This enables messages to be enqueued and
     * periodically sent to the peers.
     */
    public start() {
        if (this._state === GossipRelayState.Active) return;
        this.logger.info("starting gossip relay for all peers");
        this._state = GossipRelayState.Active;
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        this._timer = setInterval(this._onTimer.bind(this), this.relayPeriodMs);
    }

    /**
     * Stops relay to peers.
     */
    public stop() {
        if (this._state === GossipRelayState.Inactive) return;
        this.logger.info("stopping gossip relay for all peers");
        clearTimeout(this._timer);
        this._state = GossipRelayState.Inactive;
    }

    /**
     * Adds a new peer to relay messages to
     * @param peer
     */
    public addPeer(peer: IPeer) {
        this._peers.set(peer, this._queue.length);
    }

    /**
     * Removes the peer from relay
     * @param peer
     */
    public removePeer(peer: IPeer) {
        this._peers.delete(peer);
    }

    /**
     * Enqueues a message to be broadcast to peers.
     * @param msg
     */
    public enqueue(msg: IWireMessage) {
        if (this.state !== GossipRelayState.Active) return;

        // For chan_ann messages there is never an update so we only
        // need to check if the chan_ann exists and add it if it doesn't
        if (msg instanceof ChannelAnnouncementMessage) {
            const existing = this._findChanAnn(msg.shortChannelId);

            // adds to the queue if there is no existing message
            if (!existing) {
                this.logger.trace("adding channel_announcement", msg.shortChannelId.toString());
                this._queue.push(msg);
                return;
            }
        }

        // For chan_update messages we will add messages that don't exist
        // or update an existing update message if one already exists
        if (msg instanceof ChannelUpdateMessage) {
            const existing = this._findChanUpd(
                msg.shortChannelId,
                msg.channelFlags.isSet(ChannelUpdateChannelFlags.direction),
            );

            // Adds to the queue if there is no existing message
            if (!existing) {
                this.logger.trace(
                    "adding channel_update",
                    msg.shortChannelId.toString(),
                    msg.channelFlags.isSet(ChannelUpdateChannelFlags.direction),
                );
                this._queue.push(msg);
                return;
            }

            // Removes the existing message and replaces with a newer
            // message by adding the new message to the back of the queue
            if (existing && existing.timestamp < msg.timestamp) {
                this.logger.trace(
                    "updating channel_update",
                    msg.shortChannelId.toString(),
                    msg.channelFlags.isSet(ChannelUpdateChannelFlags.direction),
                );
                const idx = this._queue.indexOf(existing);
                this._queue.splice(idx, 1);
                this._queue.push(msg);
                return;
            }
        }

        // For node_ann messages we look for the existing messages and
        // abort if the new msg is older than the current node_ann we
        // have in the message queue.
        if (msg instanceof NodeAnnouncementMessage) {
            const existing = this._findNodeAnn(msg.nodeId);

            // Adds to the queue if there is no existing message
            if (!existing) {
                this.logger.trace("adding node_announcement", msg.nodeId.toString("hex"));
                this._queue.push(msg);
                return;
            }

            // Removes the existing message and replaces with a newer
            // message by adding the new message to the back of the queue
            if (existing && existing.timestamp < msg.timestamp) {
                this.logger.trace("updating node_announcement", msg.nodeId.toString("hex"));
                const idx = this._queue.indexOf(existing);
                this._queue.splice(idx, 1);
                this._queue.push(msg);
                return;
            }
        }
    }

    /**
     * Finds a channel_announcement message based on the short_channel_id
     * @param scid
     */
    private _findChanAnn(scid: ShortChannelId): ChannelAnnouncementMessage {
        return this._queue.find(
            p =>
                p instanceof ChannelAnnouncementMessage &&
                p.shortChannelId.toNumber() === scid.toNumber(),
        ) as ChannelAnnouncementMessage;
    }

    /**
     * Finds a channel_update message based on the short_channel_id and
     * direction. The found message can then be compared to an inbound
     * message to determine if the new message is newer.
     * @param scid
     * @param direction
     */
    private _findChanUpd(scid: ShortChannelId, direction: boolean): ChannelUpdateMessage {
        return this._queue.find(
            p =>
                p instanceof ChannelUpdateMessage &&
                p.shortChannelId.toNumber() === scid.toNumber() &&
                p.channelFlags.isSet(ChannelUpdateChannelFlags.direction) === direction,
        ) as ChannelUpdateMessage;
    }

    /**
     * Finds a node_announcement message based on the node_id. The
     * returned message can be compared to newer messages using the
     * timestamp.
     * @param nodeId
     */
    private _findNodeAnn(nodeId: Buffer): NodeAnnouncementMessage {
        return this._queue.find(
            p => p instanceof NodeAnnouncementMessage && p.nodeId.equals(nodeId),
        ) as NodeAnnouncementMessage;
    }

    /**
     * Fires when the timer ticks and will flush messages to peers and
     * prune the queue
     */
    private _onTimer() {
        this.logger.debug(`periodic flush, ${this._peers.size} peers, ${this._queue.length} hot messages`); // prettier-ignore
        for (const peer of this._peers.keys()) {
            this._flushToPeer(peer);
        }

        this._pruneQueue();
    }

    /**
     * Flushes message to a peer based on the index of messages that
     * the peer has received.
     * @param peer
     */
    private _flushToPeer(peer: IPeer) {
        for (let i = this._peers.get(peer); i < this._queue.length; i++) {
            const message = this._queue[i];
            peer.sendMessage(message);
            this._peers.set(peer, this._queue.length);
        }
    }

    /**
     * Prunes excess message
     */
    private _pruneQueue() {
        // calculate the delete count based on the current queue length
        // and the max allowed queue length
        const deleteCount = Math.max(0, this._queue.length - this.maxQueueLen);

        // do nothing if we don't need to prune any items
        if (deleteCount === 0) return;

        // pruning the excess items from the start of the queue
        this._queue.splice(0, deleteCount);

        // adjust all of the peers by reducing their index position by
        // the delete count
        for (const [peer, index] of this._peers.entries()) {
            this._peers.set(peer, index - deleteCount);
        }

        this.logger.debug(`pruned ${deleteCount} old messages`);
    }
}
