import { ILogger } from "@node-lightning/logger";
import { EventEmitter } from "events";
import { IWireMessage } from "../messages/IWireMessage";
import { QueryChannelRangeMessage } from "../messages/QueryChannelRangeMessage";
import { ReplyChannelRangeMessage } from "../messages/ReplyChannelRangeMessage";
import { IMessageSenderReceiver } from "../Peer";
import { ShortChannelId } from "../ShortChannelId";
import { GossipError, GossipErrorCode } from "./GossipError";

export enum ChannelRangeQueryState {
    Idle,
    Active,
    Complete,
    Failed,
}

/**
 * Performs a single query_channel_range operation and encapsulates the state
 * machine performed during the query operations.
 *
 * A single query_channel_range may be too large to fit in a single
 * reply_channel_range response. When this happens, there will be multiple
 * reply_channel_range responses to address the query_channel_range message.
 *
 * There are two modes of replies: Legacy LND and Standard.
 *
 * Standard was defined in changes to BOLT7 that were merged in with #730. These
 * changes clarified the meaning of the reply fields to ensure the recipient
 * of replies knows when the query has successfully completed. This includes:
 *
 *  - a node must not submit a new query_channel_range until the full set of
 *  reply_channel_range messages covering the range are received.
 *
 *  - clarified the meaning of full_information (previously complete) to
 *  indicate that the responding node contains complete information for the
 *  chain_hash, not that the reply is complete.
 *
 *  - enforces that when there are multiple reply_channel_range msgs, the
 *  range of blocks must be strictly increasing until the full query range is
 *  covered. This range may exceed (both below and above) the request range.
 *  This means:
 *     - the first reply first_blocknum must be <= requests first_blocknum
 *     - subsequent first_blocknum will be strictly increasing from the
 *     previous reply's first_blocknum+number_of_blocks
 *     - the final first_blocknum+number_of_blocks must be >= the query's
 *     first_blocknum+number_of_blocks
 *
 * This is functionality is a clarification from Legacy LND mode where
 * gossip_queries was implemented in a different manner.
 *
 * - full_information indicated a multipart message that was incomplete
 * - first_blocknum+number_of_blocks matches the query for each reply message
 */
export class ChannelRangeQuery {
    private _state: ChannelRangeQueryState;
    private _isLegacy = false;
    private _query: QueryChannelRangeMessage;
    private _results: ShortChannelId[] = [];
    private _error: GossipError;
    private _resolve: (scids: ShortChannelId[]) => void;
    private _reject: (reason: any) => void;

    constructor(
        readonly chainHash: Buffer,
        readonly peer: IMessageSenderReceiver,
        readonly logger: ILogger,
        isLegacy: boolean = false,
    ) {
        this._state = ChannelRangeQueryState.Idle;
        this._isLegacy = isLegacy;
        this._onMessage = this._onMessage.bind(this);
        this.peer.on("message", this._onMessage);
    }

    /**
     * Returns true if we detect this is using the legacy querying gossip_queries
     * mechanism that was originally implemented in LND. This code may be able to
     * be removed eventually.
     */
    public get isLegacy() {
        return this._isLegacy;
    }

    /**
     * Gets the current state of the Query object
     */
    public get state(): ChannelRangeQueryState {
        return this._state;
    }

    /**
     * Results found
     */
    public get results(): ShortChannelId[] {
        return this._results;
    }

    /**
     * Gets the error that was encountered during processing
     */
    public get error(): GossipError {
        return this._error;
    }

    /**
     * Resolves when the query has completed, otherwise it will reject on an
     * error.
     */
    public queryRange(
        firstBlock: number = 0,
        numBlocks = 4294967295 - firstBlock,
    ): Promise<ShortChannelId[]> {
        // Construct a promise that will be resolved after all query logic has
        // succeeded or failed. This is a slightly different pattern in that
        // we use an private event emitter to signal completion or failure
        // asynchronously. We use those handlers to resolve the promise. As a
        // result, the external interface is very clean, but we can have
        // complicated internal operations
        return new Promise((resolve, reject) => {
            // transition the state to active
            this._state = ChannelRangeQueryState.Active;

            // send the query message and start the process
            this._sendQuery(firstBlock, numBlocks);

            // capture the promise methods so we can invoke them from
            // within our state machine.
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    /**
     * Idempotent method that marks the state machine failed
     * @param error
     */
    private _transitionFailed(error: GossipError) {
        if (this._state !== ChannelRangeQueryState.Active) return;
        this.peer.off("message", this._onMessage);
        this._error = error;
        this._state = ChannelRangeQueryState.Failed;
        this._reject(error);
    }

    /**
     * Idempotent method that marks the state machine complete
     */
    private _transitionComplete() {
        if (this._state !== ChannelRangeQueryState.Active) return;
        this.peer.off("message", this._onMessage);
        this._state = ChannelRangeQueryState.Complete;
        this._resolve(this._results);
    }

    /**
     * Constructs and sends the query message the remote peer.
     * @param firstBlock
     * @param numBlocks
     */
    private _sendQuery(firstBlock: number, numBlocks: number) {
        this.logger.info(
            "sending query_channel_range start_block=%d end_block=%d",
            firstBlock,
            firstBlock + numBlocks - 1,
        );

        // send message
        const msg = new QueryChannelRangeMessage();
        msg.chainHash = this.chainHash;
        msg.firstBlocknum = firstBlock;
        msg.numberOfBlocks = numBlocks;
        this.peer.sendMessage(msg);

        // capture the active query to check reply if it is a legacy reply
        this._query = msg;
    }

    /**
     * Check if this has the signature of a legacy reply. We can detect this by
     * looking at a complete=false, scids exist, and the first_blocknum and
     * number_of_blocks matches the values in the target query.
     * @param msg
     */
    private _isLegacyReply(
        msg: ReplyChannelRangeMessage,
        query: QueryChannelRangeMessage,
    ): boolean {
        return (
            !msg.fullInformation &&
            msg.shortChannelIds.length &&
            msg.firstBlocknum === query.firstBlocknum &&
            msg.numberOfBlocks === query.numberOfBlocks
        );
    }

    /**
     * Handles incoming peer messages but is filtered to only look for
     * reply_channel_range messages.
     */
    private _onMessage(msg: IWireMessage) {
        if (msg instanceof ReplyChannelRangeMessage) {
            // check the incoming message to see if we need to transition to legacy
            // mode. If it is determined to be in legacy mode, we will switch the
            // strategy that is used to handle the reply.
            if (!this._isLegacy && this._isLegacyReply(msg, this._query)) {
                this._isLegacy = true;
                this.logger.info("using legacy LND query_channel_range technique");
            }

            // handle the message according to which state the reply system is working
            if (this._isLegacy) {
                this._handleLegacyReply(msg);
            } else {
                this._handleReply(msg);
            }
            return;
        }
    }

    /**
     * Handles a reply_channel_range message which ensures that the entire queried
     * range has been received. The responder can reply with pre-sized ranges
     * which means the reply range may not be the EXACT range requested but will
     * include the queried range.
     *
     * For a query range with first_blocknum and number_of_blocks arguments,
     * we can expect messages to have the following:
     *
     *  - first reply first_blocknum <= requested first_blocknum
     *  - intermediate replies sequentially ordered so that first_blocknum is the
     *    first_blocknum + number_of_blocks from previous reply (strictly ordered)
     *  - last reply has fist_blocknum + number_of_blocks >= the queries
     *    first_blocknum + number_of_blocks
     *
     * This ordering allows us to know when a message is complete. If a reply has
     * full_information=false, then the remote peer does not maintain a
     * up-to-date information for the supplied chain_hash.
     * @param msg
     */
    private _handleReply(msg: ReplyChannelRangeMessage) {
        this.logger.debug(
            "received reply_channel_range - full_info=%d start_block=%d end_block=%d scid_count=%d",
            msg.fullInformation,
            msg.firstBlocknum,
            msg.firstBlocknum + msg.numberOfBlocks - 1,
            msg.shortChannelIds.length,
        );

        // enqueues any scids to be processed by a query_short_chan_id message
        if (msg.shortChannelIds.length) {
            this._results.push(...msg.shortChannelIds);
        }

        // The full_information flag should only return false when the remote peer
        // does not maintain up-to-date information for the request chain_hash
        if (!msg.fullInformation) {
            const error = new GossipError(GossipErrorCode.ReplyChannelRangeNoInformation, msg);
            this._transitionFailed(error);
            return;
        }

        // We can finished when we have received a reply that covers the full range
        // of requested data. We know the final block height will be the querie's
        // first_blocknum + number_of_blocks.
        const currentHeight = msg.firstBlocknum + msg.numberOfBlocks;
        const targetHeight = this._query.firstBlocknum + this._query.numberOfBlocks;
        if (currentHeight >= targetHeight) {
            this.logger.debug(
                "received final reply_channel_range height %d >= query_channel_range height %d",
                currentHeight,
                targetHeight,
            );
            this._transitionComplete();
            return;
        }
    }

    /**
     * Handles a reply_channel_range message using the legacy strategy. This
     * code will error if fullInformation=0 scids=[] and will be considered
     * complete when fullInformation=1.
     * @param msg
     */
    private _handleLegacyReply(msg: ReplyChannelRangeMessage) {
        this.logger.debug(
            "received reply_channel_range - full_info=%d start_block=%d end_block=%d scid_count=%d",
            msg.fullInformation,
            msg.firstBlocknum,
            msg.firstBlocknum + msg.numberOfBlocks - 1,
            msg.shortChannelIds.length,
        );

        // enqueues any scids to be processed by a query_short_chan_id message
        if (msg.shortChannelIds.length) {
            this.results.push(...msg.shortChannelIds);
        }

        // Check the complete flag and the existance of SCIDs. Unfortunately,
        // non-confirming implementations are incorrectly using the completion
        // flag to a multi-message reply.
        if (msg.fullInformation && !this.results.length) {
            const error = new GossipError(GossipErrorCode.ReplyChannelRangeNoInformation, msg);
            this._transitionFailed(error);
            return;
        }

        // If we see a fullInformation flag then we have received all parts of
        // the multipart message and are complete.
        if (msg.fullInformation) {
            this._transitionComplete();
            return;
        }
    }
}
