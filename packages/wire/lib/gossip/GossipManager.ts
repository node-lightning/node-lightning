import { ILogger } from "@node-lightning/logger";
import { EventEmitter } from "events";
import { OutPoint } from "../domain/OutPoint";
import { ChannelAnnouncementMessage } from "../messages/ChannelAnnouncementMessage";
import { ExtendedChannelAnnouncementMessage } from "../messages/ExtendedChannelAnnouncementMessage";
import { IWireMessage } from "../messages/IWireMessage";
import { MessageType } from "../MessageType";
import { Peer } from "../Peer";
import { PeerState } from "../PeerState";
import { ShortChannelId } from "../ShortChannelId";
import { WireError, WireErrorCode } from "../WireError";
import { GossipFilter } from "./GossipFilter";
import { GossipPeer } from "./GossipPeer";
import { GossipRelay, IGossipRelay } from "./GossipRelay";
import { IGossipStore } from "./GossipStore";
import { IGossipFilterChainClient } from "./IGossipFilterChainClient";

export enum SyncState {
    Unsynced,
    Syncing,
    Synced,
}

// tslint:disable-next-line: interface-name
export declare interface GossipManager {
    on(event: "message", fn: (msg: IWireMessage) => void): this;
    on(event: "error", fn: (err: Error) => void): this;
    on(event: "flushed", fn: () => void): this;
    off(event: "restored", fn: (block: number) => void): this;
    off(event: "message", fn: (msg: IWireMessage) => void): this;
    off(event: "error", fn: (err: Error) => void): this;
    off(event: "flushed", fn: () => void): this;
}

/**
 * GossipManager provides is a facade for many parts of gossip. It
 * orchestrates for validating, storing, and emitting
 * routing gossip traffic obtained by peers.
 */
export class GossipManager extends EventEmitter {
    public blockHeight: number;
    public started: boolean;
    public syncState: SyncState;
    public isSynchronizing: boolean;
    public gossipRelay: IGossipRelay;
    public readonly peers: Set<GossipPeer>;
    public readonly logger: ILogger;

    constructor(
        logger: ILogger,
        readonly gossipStore: IGossipStore,
        readonly pendingStore: IGossipStore,
        readonly chainClient?: IGossipFilterChainClient,
    ) {
        super();
        this.logger = logger.sub("gspmgr");
        this.peers = new Set<GossipPeer>();
        this.syncState = SyncState.Unsynced;
        this.gossipRelay = new GossipRelay(logger.sub("gsprel"), 60000, 2000);
    }

    /**
     * The number of peers managed by the PeerManager
     */
    get peerCount(): number {
        return this.peers.size;
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

        await this._restoreState();

        // emit all restored messages
        for await (const msg of this.allMessages()) {
            this.emit("message", msg);
        }

        // start the gossip relay manager
        this.gossipRelay.start();

        // flag that the manager has now started
        this.started = true;
    }

    /**
     * Adds a new peer to the GossipManager and subscribes to events that will
     * allow it to iteract with other sub-systems managed by the GossipManager.
     */
    public addPeer(peer: Peer) {
        if (!this.started) throw new WireError(WireErrorCode.gossipManagerNotStarted);

        if (peer.state === PeerState.Ready) {
            this._onPeerReady(peer);
        } else {
            peer.once("ready", () => this._onPeerReady(peer));
        }
    }

    /**
     * Removes the channel from storage by the gossip manager. This
     * will likely be called by a chain-monitoring service.
     */
    public async removeChannel(scid: ShortChannelId) {
        this.logger.debug("removing channel %s", scid.toString());
        await this.gossipStore.deleteChannelAnnouncement(scid);
    }

    /**
     * Removes the channel from storage by the gossip manager. This will
     * likely be called by a chain-monitoring service.
     * @param outpoint
     */
    public async removeChannelByOutpoint(outpoint: OutPoint) {
        const chanAnn = await this.gossipStore.findChannelAnnouncementByOutpoint(outpoint);
        if (!chanAnn) return;
        await this.removeChannel(chanAnn.shortChannelId);
    }

    /**
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
        const chanAnns = await this.gossipStore.findChannelAnnouncemnts();
        for (const chanAnn of chanAnns) {
            yield chanAnn;

            // load and add the node1 channel_update
            const update1 = await this.gossipStore.findChannelUpdate(chanAnn.shortChannelId, 0);
            if (update1) yield update1;

            // load and add the nod2 channel_update
            const update2 = await this.gossipStore.findChannelUpdate(chanAnn.shortChannelId, 1);
            if (update2) yield update2;

            // optionally load node1 announcement
            const nodeId1 = chanAnn.nodeId1.toString("hex");
            if (!seenNodeIds.has(nodeId1)) {
                seenNodeIds.add(nodeId1);
                const nodeAnn = await this.gossipStore.findNodeAnnouncement(chanAnn.nodeId1);
                if (nodeAnn) yield nodeAnn;
            }

            // optionally load node2 announcement
            const nodeId2 = chanAnn.nodeId2.toString("hex");
            if (!seenNodeIds.has(nodeId2)) {
                seenNodeIds.add(nodeId2);
                const nodeAnn = await this.gossipStore.findNodeAnnouncement(chanAnn.nodeId2);
                if (nodeAnn) yield nodeAnn;
            }
        }

        // Broadcast unattached node announcements. These may have been orphaned
        // from previously closed channels, or if the node allows node_ann messages
        // without channels.
        const nodeAnns = await this.gossipStore.findNodeAnnouncements();
        for (const nodeAnn of nodeAnns) {
            if (!seenNodeIds.has(nodeAnn.nodeId.toString("hex"))) yield nodeAnn;
        }
    }

    /**
     * Handles when a peer has been added to the manager and it is finally
     * ready and has negotiated the gossip technique.
     * @param peer
     */
    private _onPeerReady(peer: Peer) {
        // Construct a gossip filter for use by the specific GossipPeer. This
        // filter will be internally used by the GossipPeer to validate and
        // capture gossip messages
        const filter = new GossipFilter({
            gossipStore: this.gossipStore,
            pendingStore: this.pendingStore,
            chainClient: this.chainClient,
        });

        // Construct the gossip Peer and add it to the collection of Peers
        // that are currently being managed by the GossipPeer
        const gossipPeer = new GossipPeer(peer, filter, this.logger);

        // Attach events from the gossipPeer
        gossipPeer.on("message", this._onGossipMessage.bind(this));
        gossipPeer.on("error", this._onGossipError.bind(this));

        // Add peer to the list of peers
        this.peers.add(gossipPeer);

        // Add event handler for a beer closing
        peer.on("close", this._onPeerClose.bind(this, gossipPeer));

        // Add the peer to the relay manager
        this.gossipRelay.addPeer(gossipPeer);

        // If we have not yet performed a full synchronization then we can
        // perform the full gossip state restore from this node
        if (this.syncState === SyncState.Unsynced) {
            // tslint:disable-next-line: no-floating-promises
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
    private _onPeerClose(gossipPeer: GossipPeer) {
        if (this.gossipRelay) {
            this.gossipRelay.removePeer(gossipPeer);
        }
        this.peers.delete(gossipPeer);
    }

    /**
     * Handles receieved gossip messages
     * @param msg
     */
    private _onGossipMessage(msg: IWireMessage) {
        if (msg.type === MessageType.ChannelAnnouncement) {
            this.blockHeight = Math.max(
                this.blockHeight,
                (msg as ChannelAnnouncementMessage).shortChannelId.block,
            );
        }

        // enqueue the message into the relayer
        this.gossipRelay.enqueue(msg);

        // emit the message generally
        this.emit("message", msg);
    }

    /**
     * Handles Gossip Errors
     */
    private _onGossipError(err: Error) {
        this.emit("error", err);
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
            for (const gossipPeer of this.peers) {
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
        const chanAnns = await this.gossipStore.findChannelAnnouncemnts();

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
                    chanAnn.outpoint.txId,
                    chanAnn.outpoint.voutIdx,
                );
                if (!utxo) {
                    await this.removeChannel(chanAnn.shortChannelId);
                }
            }
        }
    }
}
