import { Block } from "@node-lightning/bitcoin";
import { LightningEventType } from "./LightningEventType";
import { IWireMessage } from "./messages/IWireMessage";
import { IPeer } from "./Peer";

/**
 * External event that should be handled by the Lightning node. There
 * are factory functions for each event type.
 */
export class LightningEvent {
    /**
     * Creates an event for a block connection
     * @param block
     * @returns
     */
    public static createBlockConnected(block: Block): LightningEvent {
        const event = new LightningEvent(LightningEventType.BlockConnected);
        event.block = block;
        return event;
    }

    /**
     * Creates an event for when a peer has messages to read
     * @param peer
     * @returns
     */
    public static createPeerReadable(peer: IPeer): LightningEvent {
        const event = new LightningEvent(LightningEventType.PeerReadable);
        event.peer = peer;
        return event;
    }

    /**
     * Creates an event for a peer message. This should be follow a readable
     * event.
     * @param peer
     * @param msg
     * @returns
     */
    public static createPeerMessage(peer: IPeer, msg: IWireMessage): LightningEvent {
        const event = new LightningEvent(LightningEventType.PeerMessage);
        event.peer = peer;
        event.msg = msg;
        return event;
    }

    /**
     * Creates and event for when a peer is a ready - as defined as
     * having performed initialization.
     * @param peer
     * @returns
     */
    public static createPeerReady(peer: IPeer): LightningEvent {
        const event = new LightningEvent(LightningEventType.PeerReady);
        event.peer = peer;
        return event;
    }

    /**
     * Creates an event for when a peer has disconnected.
     * @param peer
     * @returns
     */
    public static createPeerDisconnected(peer: IPeer): LightningEvent {
        const event = new LightningEvent(LightningEventType.PeerDisconnected);
        event.peer = peer;
        return event;
    }

    /**
     * A peer which is attached for any peer related event.
     */
    public peer: IPeer;

    /**
     * A wire message received by a peer
     */
    public msg: IWireMessage;

    /**
     * The block for a block connected or disconnected event.
     */
    public block: Block;

    constructor(readonly type: LightningEventType) {}
}
