import { ILogger } from "@lntools/logger";
import { EventEmitter } from "events";
import { QueryChannelRangeMessage } from "../messages/QueryChannelRangeMessage";
import { IMessageSenderReceiver } from "../Peer";
import { ChannelRangeQuery } from "./ChannelRangeQuery";
import { IQueryChannelRangeStrategy } from "./IQueryChannelRangeStrategy";
import { IQueryShortIdsStrategy } from "./IQueryShortIdsStrategy";

/**
 * Ensures that only a single query channel can be executing at the same time.
 */
export class QueryChannelRangeStrategy extends EventEmitter implements IQueryChannelRangeStrategy {
    private _queue: Array<[number, number]> = [];
    private _blocked: boolean = false;
    private _isLegacy = false;
    private _lastQuery: QueryChannelRangeMessage;

    constructor(
        readonly chainHash: Buffer,
        readonly peer: IMessageSenderReceiver,
        readonly logger: ILogger,
        readonly queryShortIdsStrategy: IQueryShortIdsStrategy,
    ) {
        super();
        this._isLegacy = false;
    }

    /**
     *
     */
    public get awaitingReply() {
        return this._blocked;
    }

    /**
     * Returns true if we detect this is using the legacy querying gossip_queries
     * mechanism that was originally implemented in LND. This code may be able to
     * be removed eventually.
     */
    public get isLegacy() {
        return this._isLegacy;
    }

    public queryRange(firstBlocknum: number = 0, numberOfBlocks = 4294967295 - firstBlocknum) {
        // enqueue the range query
        this._queue.push([firstBlocknum, numberOfBlocks]);

        // Check if a range query has already been sent and if it has enqueue the
        // query until a reply is received from the peer. This is required to
        // conform to BOLT7 which indicates a single pending query message can be
        // outstanding at one time.

        if (!this._blocked) {
            this._sendQuery();
        }
    }

    /**
     * Sends a query message and caches the pending query results for use when
     * a reply is received.
     */
    private _sendQuery() {
        // obtain the next queued item that should be sent
        const query = this._queue.shift();

        // abort if there is nothing to do
        if (!query) return;

        // cool, we have a query, so lets block further execution
        this._blocked = true;

        // extract the parameters of the queue query
        const [firstBlocknum, numberOfBlocks] = query;

        // construct a new query state machine
        const rangeQuery = new ChannelRangeQuery(
            this.chainHash,
            this.peer,
            this.logger,
            this._isLegacy,
        );

        // listen for the complete vent, unblock and continue on
        rangeQuery.on("error", err => {
            this._blocked = false;
            this.emit("channel_range_failed", err);
            this._sendQuery();
        });

        // listen for the complete event, unblock and continue on
        rangeQuery.on("complete", scids => {
            if (scids.length) {
                this.queryShortIdsStrategy.enqueue(...scids);
            }
            this._blocked = false;
            this._sendQuery();
        });

        // fire off the query
        rangeQuery.queryRange(firstBlocknum, numberOfBlocks);
    }
}
