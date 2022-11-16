import { ILogger } from "@node-lightning/logger";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";
import { GossipQueriesSync } from "./GossipQueriesSync";
import { Peer } from "../Peer";
import { GossipQueriesReceiver } from "./GossipQueriesReceiver";

/**
 * Retains state for peers based on
 */
export class GossipPeer {
    public syncTask: GossipQueriesSync;
    public readonly key: string;

    protected logger: ILogger;
    protected receiver: GossipQueriesReceiver;

    constructor(logger: ILogger, readonly peer: Peer) {
        this.logger = logger.sub(GossipPeer.name);
        this.key = peer.id;
        if (this.gossipQueries) {
            this.receiver = new GossipQueriesReceiver(
                this.peer.localChains[0],
                this.peer,
                this.logger,
            );
        }
    }

    /**
     * Returns true if the gossip_queries feature has been negotiated with the
     * remote peer.
     */
    public get gossipQueries(): boolean {
        return (
            this.peer.remoteFeatures.isSet(InitFeatureFlags.gossipQueriesOptional) ||
            this.peer.remoteFeatures.isSet(InitFeatureFlags.gossipQueriesRequired)
        );
    }

    /**
     * Enables the receipt of rumor mongered messages.
     */
    public enableGossip() {
        if (this.gossipQueries) {
            this.receiver.activate();
        }
    }

    /**
     * Disables the receipt of rumor mongered messages.
     */
    public disableGossip() {
        if (this.gossipQueries) {
            this.receiver.deactivate();
        }
    }

    /**
     * Performs Gossip synchronization using the negotiated strategy. Currently
     * only support gossip_queries
     * @param firstBlock
     * @param numBlocks
     */
    public async syncRange(firstBlock?: number, numBlocks?: number): Promise<boolean> {
        if (this.gossipQueries) {
            const chainHash = this.peer.localChains[0];
            this.syncTask = new GossipQueriesSync(chainHash, this.peer, this.logger);
            await this.syncTask.queryRange(firstBlock, numBlocks);
            this.syncTask = undefined;
            return true;
        }
        return false;
    }
}
