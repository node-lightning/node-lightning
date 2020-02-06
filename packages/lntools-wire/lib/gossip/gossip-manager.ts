import { Logger } from "@lntools/logger";
import { EventEmitter } from "events";
import { IWireMessage } from "../messages/wire-message";
import { Peer } from "../peer";
import { PeerState } from "../peer-state";
import { ShortChannelId } from "../shortchanid";
import { WireError, WireErrorCode } from "../wire-error";
import { GossipFilter } from "./gossip-filter";
import { IGossipFilterChainClient } from "./gossip-filter-chain-client";
import { IGossipStore } from "./gossip-store";
import { PeerGossipSynchronizer } from "./peer-gossip-synchronizer";

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
  public chainHash: Buffer;
  public logger: Logger;
  public blockHeight: number;
  public started: boolean;
  private _peers: Set<Peer>;
  private _gossipStore: IGossipStore;
  private _pendingStore: IGossipStore;
  private _gossipFilter: GossipFilter;
  private _gossipSyncers: Map<Peer, PeerGossipSynchronizer>;

  constructor({
    chainClient,
    chainHash,
    logger,
    gossipStore,
    pendingStore,
  }: {
    chainHash: Buffer;
    logger: Logger;
    gossipStore: IGossipStore;
    pendingStore: IGossipStore;
    chainClient?: IGossipFilterChainClient;
  }) {
    super();
    this.chainHash = chainHash;
    this.logger = logger;

    this._gossipStore = gossipStore;
    this._pendingStore = pendingStore;

    this._peers = new Set<Peer>();
    this._gossipSyncers = new Map<Peer, PeerGossipSynchronizer>();

    this._onPeerMessage = this._onPeerMessage.bind(this);

    this._gossipFilter = new GossipFilter({ gossipStore, pendingStore, chainClient });
    this._gossipFilter.on("message", this._onFilterMessage.bind(this));
    this._gossipFilter.on("error", this._onError.bind(this));
    this._gossipFilter.on("flushed", () => this.emit("flushed"));
  }

  /**
   * The number of peers managed by the PeerManager
   */
  get peerCount(): number {
    return this._peers.size;
  }

  /**
   * Starts the gossip manager. This method will interrogate the gossip
   * store to obtain the highest block height. This value will be
   * used when peers are added to obtain missing information.
   */
  public async start() {
    await this._restoreState();
    this.started = true;
  }

  /**
   * Adds a new peer to the GossipManager and subscribes to
   * events that will allow it to iteract with other sub-systems
   * managed by the GossipManager.
   */
  public addPeer(peer: Peer) {
    if (!this.started) throw new WireError(WireErrorCode.gossipManagerNotStarted);

    this.logger.info("syncing peer %s", peer.toString());
    this._peers.add(peer);
    peer.on("message", this._onPeerMessage);
    peer.on("close", () => this.removePeer(peer));

    // construct a gossip synchronizer for the peer
    const gossipSyncer = new PeerGossipSynchronizer({
      peer,
      chainHash: this.chainHash,
      logger: this.logger,
    });
    this._gossipSyncers.set(peer, gossipSyncer);

    // activate using gossip_timestamp_filter based on the current date
    gossipSyncer.activate();

    // request historical sync
    if (this._peers.size === 1) {
      const BLOCKS_PER_DAY = 144;
      const ourFirstBlock = 0;
      const queryFirstBlock = Math.max(0, ourFirstBlock - BLOCKS_PER_DAY);

      if (peer.state === PeerState.ready) {
        gossipSyncer.syncRange(queryFirstBlock);
      } else {
        peer.once("ready", () => gossipSyncer.syncRange(queryFirstBlock));
      }
    }
  }

  /**
   * Removes the peer from the manager and unsubscribes from all
   * events that are emitted by the peer.
   */
  public removePeer(peer: Peer) {
    this._peers.delete(peer);
    peer.off("message", this._onPeerMessage);
  }

  /**
   * Removes the channel from storage by the gossip manager. This
   * will likely be called by a chain-monitoring service.
   */
  public async removeChannel(scid: ShortChannelId) {
    await this._gossipStore.deleteChannelAnnouncement(scid);
  }

  private _onPeerMessage(msg: IWireMessage) {
    this._gossipFilter.enqueue(msg);
  }

  private _onFilterMessage(msg: IWireMessage) {
    this.emit("message", msg);
  }

  private _onError(err: Error) {
    this.emit("error", err);
  }

  private async _restoreState() {
    this.logger.info("retrieving gossip state");
    this.blockHeight = 0;
    const chanAnns = await this._gossipStore.findChannelAnnouncemnts();
    for (const chanAnn of chanAnns) {
      this.blockHeight = Math.max(this.blockHeight, chanAnn.shortChannelId.block);
    }
    this.logger.info("%d channels restored with highest block %d", chanAnns.length, this.blockHeight); // prettier-ignore
  }
}
