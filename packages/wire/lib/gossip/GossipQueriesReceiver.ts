import { ILogger } from "@lntools/logger";
import { GossipTimestampFilterMessage } from "../messages/GossipTimestampFilterMessage";
import { IMessageSender } from "../Peer";
import { PeerGossipReceiveState } from "./GossipReceiveState";

export enum GossipQueriesReceiverState {
    Idle,
    Receiving,
}

/**
 * This class is used to activate / deactivate receiving of gossip messages
 * when the gossip_queries or gossip_queries_ex gossip sync strategies are used.
 */
export class GossipQueriesReceiver {
    private _state: GossipQueriesReceiverState;
    private _firstTimestamp: number;
    private _timestampRange: number;

    constructor(
        readonly chainHash: Buffer,
        readonly peer: IMessageSender,
        readonly logger: ILogger,
    ) {
        this._state = GossipQueriesReceiverState.Idle;
        this._firstTimestamp = 0xffffffff;
        this._timestampRange = 0;
    }

    public get state(): GossipQueriesReceiverState {
        return this._state;
    }

    public get firstTimestamp(): number {
        return this._firstTimestamp;
    }

    public get timestampRange(): number {
        return this._timestampRange;
    }

    /**
     * Deactivates gossip with the remote peer by sending a
     * gossip_timestamp_filter message that disables broadcast. In particular this
     * message will use a first_timestamp of uint32_max and a timestamp_range of
     * 0 to prevent the remote peer from sending information.
     */
    public deactivate() {
        this.logger.info("deactivating gossip");

        // reset params
        this._firstTimestamp = 0xffffffff;
        this._timestampRange = 0;

        // send message
        const msg = new GossipTimestampFilterMessage();
        msg.chainHash = this.chainHash;
        msg.firstTimestamp = 0xffffffff;
        msg.timestampRange = 0;
        this.peer.sendMessage(msg);

        // change state
        this._state = GossipQueriesReceiverState.Idle;
    }

    /**
     * Activates gossip with the remote peer by sending a gossip_timestamp_filter
     * message with the specified first timestamp and range. By default, this
     * starts gossip with the current timestamp and uint32_max as the range.
     * @param start
     * @param range
     */
    public activate(start: number = Math.trunc(Date.now() / 1000), range = 0xffffffff) {
        this.logger.info("activating gossip for range %d to %d", start, range);

        // set params
        this._firstTimestamp = start;
        this._timestampRange = range;

        // send message
        const msg = new GossipTimestampFilterMessage();
        msg.chainHash = this.chainHash;
        msg.firstTimestamp = start;
        msg.timestampRange = range;
        this.peer.sendMessage(msg);

        // change state
        this._state = GossipQueriesReceiverState.Receiving;
    }
}
