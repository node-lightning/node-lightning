import { ILogger } from "@node-lightning/logger";
import { IWireMessage } from "../messages/IWireMessage";
import { MessageType } from "../MessageType";
import { IPeer, Peer } from "../Peer";
import { GossipFilter } from "./GossipFilter";
import { SyncState } from "./SyncState";
import { GossipPeer } from "./GossipPeer";
import { IGossipFilterChainClient } from "./IGossipFilterChainClient";
import { GossipRelay, IGossipRelay } from "./GossipRelay";
import { DnsPeerQuery } from "./DnsPeerQuery";
import { ChannelAnnouncementMessage } from "../messages/ChannelAnnouncementMessage";
import { ExtendedChannelAnnouncementMessage } from "../messages/ExtendedChannelAnnouncementMessage";
import { BitField } from "../BitField";
import { ShortChannelId } from "../domain/ShortChannelId";
import { HashByteOrder, OutPoint } from "@node-lightning/bitcoin";
import { WireError, WireErrorCode } from "../WireError";
import { PeerHostRecord } from "../PeerHostRecord";
import { WireMessageResult } from "../WireMessageResult";
import { Result } from "../Result";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";

export class PeerGossipState {
    public gossipRelay: boolean;
}

/**
 * GossipManager provides is a facade for many parts of gossip. It
 * orchestrates for validating, storing, and emitting
 * routing gossip traffic obtained by peers.
 */
export class GossipManager {
    public blockHeight: number;
    public started: boolean;
    public syncState: SyncState;
    public isSynchronizing: boolean;
    public gossipRelay: IGossipRelay;
    public dnsPeerQuery: DnsPeerQuery;
    protected logger: ILogger;
    protected peers: Map<string, GossipPeer>;

    constructor(
        logger: ILogger,
        readonly gossipFilter: GossipFilter,
        readonly chainClient?: IGossipFilterChainClient,
    ) {
        this.logger = logger.sub(GossipManager.name);
        this.peers = new Map<string, GossipPeer>();
        this.syncState = SyncState.Unsynced;
        this.gossipRelay = new GossipRelay(logger.sub(GossipRelay.name), 60000, 2000);
    }

    /**
     * Starts the gossip manager. This method will load information
     * from the gossip store, determine when the last information
     * was obtained, validate the existing messages (to see if any
     * channels have closed), and finally emit all messages that
     * exist in the system.
     */
    public async start() {
        this.logger.info("starting gossip manager");

        // wait for chain sync to complete
        if (this.chainClient) {
            this.logger.info("waiting for chain sync");
            await this.chainClient.waitForSync();
            this.logger.info("chain sync complete");
        }

        // Restore the state
        await this._restoreState();

        // start the gossip relay manager
        this.gossipRelay.start();

        // flag that the manager has now started
        this.started = true;
    }

    public onPeerReady(peer: IPeer) {
        const gossipPeer = new GossipPeer(this.logger, peer);
        this.peers.set(gossipPeer.key, gossipPeer);

        // Add the peer to the relay manager
        this.gossipRelay.addPeer(peer);

        // If we have not yet performed a full synchronization then we can
        // perform the full gossip state restore from this node
        if (this.syncState === SyncState.Unsynced) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this._syncPeer(gossipPeer);
        }

        // If we've already synced, simply enable gossip receiving for the peer
        else {
            gossipPeer.enableGossip();
        }
    }

    /**
     * Handles when a peer closes
     * @param gossipPeer
     */
    public onPeerClose(peer: Peer) {
        const gossipPeer = this.findPeer(peer);
        if (this.gossipRelay) {
            this.gossipRelay.removePeer(peer);
        }
        this.peers.delete(gossipPeer.key);
    }

    /**
     * TODO: Refactor this out of here. It should be part of the PeerManager!
     * Uses a dns seed to discover and add peers to be managed by the GossipManager.
     */
    public async bootstrapPeers(
        ls: Buffer,
        localFeatures: BitField<InitFeatureFlags>,
        localChains: Buffer[],
        logger: ILogger,
        dnsSeed: string,
    ): Promise<void> {
        if (!this.started) throw new WireError(WireErrorCode.gossipManagerNotStarted);

        const peerRecords: PeerHostRecord[] = await this.dnsPeerQuery.query({ dnsSeed: dnsSeed });

        for (const peerRecord of peerRecords) {
            const peer = new Peer(ls, localFeatures, localChains, logger);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            peer.once("ready", this.onPeerReady.bind(this));
            peer.connect(peerRecord.publicKey, peerRecord.address, peerRecord.port);
        }
    }

    /**
     * TODO: Refactor this. It should be event based, not imperative.
     *  Removes the channel from storage by the gossip manager. This
     * will likely be called by a chain-monitoring service.
     */
    public async removeChannel(scid: ShortChannelId) {
        this.logger.debug("removing channel %s", scid.toString());
        await this.gossipFilter.gossipStore.deleteChannelAnnouncement(scid);
    }

    /**
     * TODO: Refactor this. It should be event based, not imperative.
     * Removes the channel from storage by the gossip manager. This will
     * likely be called by a chain-monitoring service.
     * @param outpoint
     */
    public async removeChannelByOutpoint(outpoint: OutPoint) {
        const chanAnn = await this.gossipFilter.gossipStore.findChannelAnnouncementByOutpoint(
            outpoint,
        );
        if (!chanAnn) return;
        await this.removeChannel(chanAnn.shortChannelId);
    }

    /**
     * TODO: Refactor this. It should be event based, not imperative.
     * Retrieves the valid chan_ann, chan_update, node_ann messages
     * while making sure to not send duplicate node_ann messages.
     *
     * @remarks
     * For now we are going to buffer messages into memory. We could
     * return a stream and yield messages as they are streamed from
     * the gossip_store.
     */
    public async *allMessages(): AsyncGenerator<IWireMessage, void, unknown> {
        this.logger.debug("fetching all messages");

        // maintain a set of node ids that we have already seen so that
        // we do no rebroadcast node announcements. This set stores the
        // nodeid pubkey as a hex string, which through testing is the
        // fastest way to perfrom set operations.
        const seenNodeIds: Set<string> = new Set();

        // obtain full list of channel announcements
        const chanAnns = await this.gossipFilter.gossipStore.findChannelAnnouncemnts();
        for (const chanAnn of chanAnns) {
            yield chanAnn;

            // load and add the node1 channel_update
            const update1 = await this.gossipFilter.gossipStore.findChannelUpdate(
                chanAnn.shortChannelId,
                0,
            );
            if (update1) yield update1;

            // load and add the nod2 channel_update
            const update2 = await this.gossipFilter.gossipStore.findChannelUpdate(
                chanAnn.shortChannelId,
                1,
            );
            if (update2) yield update2;

            // optionally load node1 announcement
            const nodeId1 = chanAnn.nodeId1.toString("hex");
            if (!seenNodeIds.has(nodeId1)) {
                seenNodeIds.add(nodeId1);
                const nodeAnn = await this.gossipFilter.gossipStore.findNodeAnnouncement(
                    chanAnn.nodeId1,
                );
                if (nodeAnn) yield nodeAnn;
            }

            // optionally load node2 announcement
            const nodeId2 = chanAnn.nodeId2.toString("hex");
            if (!seenNodeIds.has(nodeId2)) {
                seenNodeIds.add(nodeId2);
                const nodeAnn = await this.gossipFilter.gossipStore.findNodeAnnouncement(
                    chanAnn.nodeId2,
                );
                if (nodeAnn) yield nodeAnn;
            }
        }

        // Broadcast unattached node announcements. These may have been orphaned
        // from previously closed channels, or if the node allows node_ann messages
        // without channels.
        const nodeAnns = await this.gossipFilter.gossipStore.findNodeAnnouncements();
        for (const nodeAnn of nodeAnns) {
            if (!seenNodeIds.has(nodeAnn.nodeId.toString("hex"))) yield nodeAnn;
        }
    }

    public findPeer(peer: IPeer): GossipPeer {
        return this.peers.get(peer.id);
    }

    public async onWireMessage(peer: IPeer, msg: IWireMessage): Promise<WireMessageResult> {
        let result: WireMessageResult;

        // process inbound messages
        if (
            msg.type === MessageType.ChannelAnnouncement ||
            msg.type === MessageType.ChannelUpdate ||
            msg.type === MessageType.NodeAnnouncement
        ) {
            try {
                const filterResult = await this.gossipFilter.validateMessage(msg);
                if (filterResult.isOk) {
                    result = Result.ok(msg);
                } else {
                    result = Result.err(filterResult.error, msg);
                }
            } catch (err) {
                // Unhandled error is something unexpected and our peer
                // is now in a broken state and we need to disconnect.
                result = Result.err(
                    new WireError(WireErrorCode.UnknownWireMessageFailure, err),
                    msg,
                );
            }
        } else {
            result = Result.ok(msg);
        }

        // process any sync task as well
        const gossipPeer = this.findPeer(peer);
        if (gossipPeer.syncTask) {
            gossipPeer.syncTask.handleWireMessage(msg);
        }

        // process valid message
        if (msg.type === MessageType.ChannelAnnouncement) {
            this.blockHeight = Math.max(
                this.blockHeight,
                (msg as ChannelAnnouncementMessage).shortChannelId.block,
            );
        }

        // enqueue the message into the relayer
        this.gossipRelay.enqueue(msg);

        return result;
    }

    /**
     * Synchronize the peer using the peer's synchronization mechanism.
     * @param peer
     */
    private async _syncPeer(peer: GossipPeer) {
        // Disable gossip relay
        this.gossipRelay.stop();

        this.logger.trace("sync status now 'syncing'");
        this.syncState = SyncState.Syncing;

        try {
            // perform synchronization
            await peer.syncRange();

            // finally transition to sync complete status
            this.logger.trace("sync status now 'synced'");
            this.syncState = SyncState.Synced;

            // enable gossip for all the peers
            this.logger.trace("enabling gossip for all peers");
            for (const gossipPeer of this.peers.values()) {
                gossipPeer.enableGossip();
            }
        } catch (ex) {
            // TODO select next peer
            this.syncState = SyncState.Unsynced;
        }

        // Enable gossip relay now that sync is complete
        this.gossipRelay.start();
    }

    private async _restoreState() {
        this.logger.info("retrieving gossip state from store");
        this.blockHeight = 0;
        const chanAnns = await this.gossipFilter.gossipStore.findChannelAnnouncemnts();

        // find best block height
        for (const chanAnn of chanAnns) {
            this.blockHeight = Math.max(this.blockHeight, chanAnn.shortChannelId.block);
        }
        this.logger.info("highest block %d found from %d channels", this.blockHeight, chanAnns.length); // prettier-ignore

        // validate all utxos
        await this._validateUtxos(chanAnns);
    }

    private async _validateUtxos(chanAnns: ChannelAnnouncementMessage[]) {
        if (!this.chainClient) {
            this.logger.info("skipping utxo validation, no chain_client configured");
            return;
        }

        const extChanAnnCount = chanAnns.reduce(
            (acc, msg) => acc + (msg instanceof ExtendedChannelAnnouncementMessage ? 1 : 0),
            0,
        );
        this.logger.info("validating %d utxos", extChanAnnCount);

        if (!extChanAnnCount) return;

        const oct = Math.trunc(extChanAnnCount / 8);
        for (let i = 0; i < chanAnns.length; i++) {
            const chanAnn = chanAnns[i];
            if ((i + 1) % oct === 0) {
                this.logger.info(
                    "validating utxos %s% complete",
                    (((i + 1) / extChanAnnCount) * 100).toFixed(2),
                );
            }
            if (chanAnn instanceof ExtendedChannelAnnouncementMessage) {
                const utxo = await this.chainClient.getUtxo(
                    chanAnn.outpoint.txid.toString(HashByteOrder.RPC),
                    chanAnn.outpoint.outputIndex,
                );
                if (!utxo) {
                    await this.removeChannel(chanAnn.shortChannelId);
                }
            }
        }
    }
}
