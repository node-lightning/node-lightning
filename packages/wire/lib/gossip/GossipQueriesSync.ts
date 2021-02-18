import { ILogger } from "@node-lightning/logger";
import { NodeAnnouncementMessage } from "../messages/NodeAnnouncementMessage";
import { ChannelAnnouncementMessage } from "../messages/ChannelAnnouncementMessage";
import { ChannelUpdateMessage } from "../messages/ChannelUpdateMessage";
import { IWireMessage } from "../messages/IWireMessage";
import { ReplyChannelRangeMessage } from "../messages/ReplyChannelRangeMessage";
import { ReplyShortChannelIdsEndMessage } from "../messages/ReplyShortChannelIdsEndMessage";
import { IMessageSender } from "../Peer";
import { ChannelRangeQuery } from "./ChannelRangeQuery";
import { ChannelsQuery } from "./ChannelsQuery";
import { GossipSyncWatcher } from "./GossipSyncWatcher";

export enum GossipQueriesSyncState {
    Idle,
    AwaitingChannelRange,
    AwaitingChannels,
    AwaitingMessages,
    Complete,
    Failed,
}

export class GossipQueriesSync {
    private _state: GossipQueriesSyncState;
    private _error: Error;
    private _rangeQuery: ChannelRangeQuery;
    private _channelsQuery: ChannelsQuery;
    private _syncWatcher: GossipSyncWatcher;

    constructor(
        readonly chainHash: Buffer,
        readonly peer: IMessageSender,
        readonly logger: ILogger,
    ) {
        this._state = GossipQueriesSyncState.Idle;
        this._rangeQuery = new ChannelRangeQuery(this.chainHash, this.peer, this.logger);
        this._channelsQuery = new ChannelsQuery(this.chainHash, this.peer, this.logger);
        this._syncWatcher = new GossipSyncWatcher(this.logger);
    }

    public get state(): GossipQueriesSyncState {
        return this._state;
    }

    public get error(): Error {
        return this._error;
    }

    public async queryRange(firstBlock?: number, numBlocks?: number): Promise<void> {
        try {
            this.logger.info("synchronization starting");
            this._state = GossipQueriesSyncState.AwaitingChannelRange;
            const scids = await this._rangeQuery.queryRange(firstBlock, numBlocks);
            this._state = GossipQueriesSyncState.AwaitingChannels;
            await this._channelsQuery.query(...scids);

            this._state = GossipQueriesSyncState.AwaitingMessages;
            await this._syncWatcher.watch();

            this.logger.info("synchronization complete!");
            this._state = GossipQueriesSyncState.Complete;
        } catch (ex) {
            this.logger.error("synchronization failed with error", ex.message);
            this._state = GossipQueriesSyncState.Failed;
            this._error = ex;
            throw ex;
        }
    }

    public handleWireMessage(msg: IWireMessage): void {
        if (msg instanceof ReplyChannelRangeMessage) {
            this._rangeQuery.handleReplyChannelRange(msg);
            return;
        } else if (msg instanceof ReplyShortChannelIdsEndMessage) {
            this._channelsQuery.handleReplyShortChannelIdsEnd(msg);
        } else if (
            msg instanceof ChannelAnnouncementMessage ||
            msg instanceof ChannelUpdateMessage ||
            msg instanceof NodeAnnouncementMessage
        ) {
            this._syncWatcher.onGossipMessage(msg);
        }
    }
}
