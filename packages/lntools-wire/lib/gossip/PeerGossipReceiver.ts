import { ILogger } from "@lntools/logger";
import { EventEmitter } from "events";
import { Peer } from "../Peer";
import { PeerState } from "../PeerState";
import { GossipTimestampFilterStrategy } from "./GossipTimestampFilterStrategy";
import { IGossipTimestampFilterStrategy } from "./IGossipTimestampFilterStrategy";
import { IQueryChannelRangeStrategy } from "./IQueryChannelRangeStrategy";
import { IQueryShortIdsStrategy } from "./IQueryShortIdsStrategy";
import { QueryChannelRangeStrategy } from "./QueryChannelRangeStrategy";
import { QueryShortIdsStrategy } from "./QueryShortIdsStrategy";

/**
 * PeerGossipReceiver is a facade over several state machines that control how
 * gossip messages are queried. Several strategies can be used depending on the
 * capabilities of the remote peer. The underlying strategies will change
 * depending on those capabitilies.
 */
export class PeerGossipReceiver extends EventEmitter {
  public gossipTimeStampFilterStrategy: IGossipTimestampFilterStrategy;
  public queryChannelRangeStrategy: IQueryChannelRangeStrategy;
  public queryShortIdsStrategy: IQueryShortIdsStrategy;

  constructor(readonly chainHash: Buffer, readonly peer: Peer, readonly logger: ILogger) {
    super();
    this.logger = logger.sub("gossip_rcvr", peer.id);

    // If the peer has gossip_queries enabled we can use the corresponding
    // strategies
    if (peer.remoteInit.localGossipQueries) {
      this.logger.info("using gossip_queries strategies");
      this.gossipTimeStampFilterStrategy = new GossipTimestampFilterStrategy(
        chainHash,
        peer,
        logger,
      );

      this.queryShortIdsStrategy = new QueryShortIdsStrategy(chainHash, peer, logger);

      this.queryChannelRangeStrategy = new QueryChannelRangeStrategy(
        this.chainHash,
        this.peer,
        this.logger,
        this.queryShortIdsStrategy,
      );
    } else {
      this.logger.info("using legacy gossip");
    }

    // enable gossip activation
    this.activate();

    // perform historical gossip sync
    this.queryRange();

    // ensure gossip activation is enabled on reconnects
    peer.on("ready", () => this.activate());
  }

  public activate(start?: number, range?: number) {
    if (this.gossipTimeStampFilterStrategy) {
      this.gossipTimeStampFilterStrategy.activate(start, range);
    }
  }

  public deactivate() {
    if (this.gossipTimeStampFilterStrategy) {
      this.gossipTimeStampFilterStrategy.deactivate();
    }
  }

  public queryRange(firstBlockNum?: number, numberOfBlocks?: number) {
    if (this.queryChannelRangeStrategy) {
      this.queryChannelRangeStrategy.queryRange(firstBlockNum, numberOfBlocks);
    }
  }
}
