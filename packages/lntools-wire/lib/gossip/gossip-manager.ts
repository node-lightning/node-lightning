import { ILogger } from "@lntools/logger";
import { EventEmitter } from "events";
import { OutPoint } from "../domain/outpoint";
import { MessageType } from "../message-type";
import { ChannelAnnouncementMessage } from "../messages/channel-announcement-message";
import { ExtendedChannelAnnouncementMessage } from "../messages/extended-channel-announcement-message";
import { IWireMessage } from "../messages/wire-message";
import { Peer } from "../peer";
import { PeerState } from "../peer-state";
import { ShortChannelId } from "../shortchanid";
import { WireError, WireErrorCode } from "../wire-error";
import { GossipFilter } from "./gossip-filter";
import { IGossipFilterChainClient } from "./gossip-filter-chain-client";
import { IGossipStore } from "./gossip-store";
import { PeerGossipReceiver } from "./PeerGossipReceiver";

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
  public logger: ILogger;
  public blockHeight: number;
  public started: boolean;
  private _peers: Set<Peer>;
  private _gossipStore: IGossipStore;
  private _pendingStore: IGossipStore;
  private _gossipFilter: GossipFilter;
  private _gossipReceivers: Map<Peer, PeerGossipReceiver>;
  private _chainClient: IGossipFilterChainClient;

  constructor({
    chainClient,
    chainHash,
    logger,
    gossipStore,
    pendingStore,
  }: {
    chainHash: Buffer;
    logger: ILogger;
    gossipStore: IGossipStore;
    pendingStore: IGossipStore;
    chainClient?: IGossipFilterChainClient;
  }) {
    super();
    this.chainHash = chainHash;
    this.logger = logger.sub("gossip_mgr");

    this._gossipStore = gossipStore;
    this._pendingStore = pendingStore;
    this._chainClient = chainClient;

    this._peers = new Set<Peer>();
    this._gossipReceivers = new Map<Peer, PeerGossipReceiver>();

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
   * Starts the gossip manager. This method will load information
   * from the gossip store, determine when the last information
   * was obtained, validate the existing messages (to see if any
   * channels have closed), and finally emit all messages that
   * exist in the system.
   */
  public async start() {
    this.logger.info("starting gossip manager");

    // wait for chain sync to complete
    if (this._chainClient) {
      this.logger.info("waiting for chain sync");
      await this._chainClient.waitForSync();
      this.logger.info("chain sync complete");
    }

    await this._restoreState();

    // emit all restored messages
    for await (const msg of this.allMessages()) {
      this.emit("message", msg);
    }

    this.started = true;
  }

  /**
   * Adds a new peer to the GossipManager and subscribes to
   * events that will allow it to iteract with other sub-systems
   * managed by the GossipManager.
   */
  public addPeer(peer: Peer) {
    if (!this.started) throw new WireError(WireErrorCode.gossipManagerNotStarted);
    this.logger.info("adding peer", peer.pubkey.toString("hex"));
    this._peers.add(peer);
    peer.on("message", this._onPeerMessage);
    peer.on("close", () => this.removePeer(peer));

    // construct a gossip synchronizer for the peer
    const gossipReceiverLogger = this.logger.sub("gossip_rcvr", peer.id);
    const gossipReceiver = new PeerGossipReceiver(this.chainHash, peer, gossipReceiverLogger);
    this._gossipReceivers.set(peer, gossipReceiver);

    // active gossip for the peer
    if (peer.state === PeerState.Ready) {
      gossipReceiver.activate(); // enables gossip
      gossipReceiver.queryRange(); // performs full historical sync
    } else {
      peer.on("ready", () => gossipReceiver.activate());
      peer.on("ready", () => gossipReceiver.queryRange());
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
    this.logger.debug("removing channel %s", scid.toString());
    await this._gossipStore.deleteChannelAnnouncement(scid);
  }

  /**
   * Removes the channel from storage by the gossip manager. This will
   * likely be called by a chain-monitoring service.
   * @param outpoint
   */
  public async removeChannelByOutpoint(outpoint: OutPoint) {
    const chanAnn = await this._gossipStore.findChannelAnnouncementByOutpoint(outpoint);
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
    const chanAnns = await this._gossipStore.findChannelAnnouncemnts();
    for (const chanAnn of chanAnns) {
      yield chanAnn;

      // load and add the node1 channel_update
      const update1 = await this._gossipStore.findChannelUpdate(chanAnn.shortChannelId, 0);
      if (update1) yield update1;

      // load and add the nod2 channel_update
      const update2 = await this._gossipStore.findChannelUpdate(chanAnn.shortChannelId, 1);
      if (update2) yield update2;

      // optionally load node1 announcement
      const nodeId1 = chanAnn.nodeId1.toString("hex");
      if (!seenNodeIds.has(nodeId1)) {
        seenNodeIds.add(nodeId1);
        const nodeAnn = await this._gossipStore.findNodeAnnouncement(chanAnn.nodeId1);
        if (nodeAnn) yield nodeAnn;
      }

      // optionally load node2 announcement
      const nodeId2 = chanAnn.nodeId2.toString("hex");
      if (!seenNodeIds.has(nodeId2)) {
        seenNodeIds.add(nodeId2);
        const nodeAnn = await this._gossipStore.findNodeAnnouncement(chanAnn.nodeId2);
        if (nodeAnn) yield nodeAnn;
      }
    }

    // Broadcast unattached node announcements. These may have been orphaned
    // from previously closed channels, or if the node allows node_ann messages
    // without channels.
    const nodeAnns = await this._gossipStore.findNodeAnnouncements();
    for (const nodeAnn of nodeAnns) {
      if (!seenNodeIds.has(nodeAnn.nodeId.toString("hex"))) yield nodeAnn;
    }
  }

  private _onPeerMessage(msg: IWireMessage) {
    this._gossipFilter.enqueue(msg);
  }

  private _onFilterMessage(msg: IWireMessage) {
    if (msg.type === MessageType.ChannelAnnouncement) {
      this.blockHeight = Math.max(
        this.blockHeight,
        (msg as ChannelAnnouncementMessage).shortChannelId.block,
      );
    }
    this.emit("message", msg);
  }

  private _onError(err: Error) {
    this.emit("error", err);
  }

  private async _restoreState() {
    this.logger.info("retrieving gossip state from store");
    this.blockHeight = 0;
    const chanAnns = await this._gossipStore.findChannelAnnouncemnts();

    // find best block height
    for (const chanAnn of chanAnns) {
      this.blockHeight = Math.max(this.blockHeight, chanAnn.shortChannelId.block);
    }
    this.logger.info("highest block %d found from %d channels", this.blockHeight, chanAnns.length); // prettier-ignore

    // validate all utxos
    await this._validateUtxos(chanAnns);
  }

  private async _validateUtxos(chanAnns: ChannelAnnouncementMessage[]) {
    if (!this._chainClient) {
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
        const utxo = await this._chainClient.getUtxo(
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
