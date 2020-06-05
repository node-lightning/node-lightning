import { ILogger } from "@lntools/logger";
import { EventEmitter } from "events";
import { IMessageSenderReceiver } from "../Peer";
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

  constructor(
    readonly chainHash: Buffer,
    readonly peer: IMessageSenderReceiver,
    readonly logger: ILogger,
  ) {
    super();

    this.gossipTimeStampFilterStrategy = new GossipTimestampFilterStrategy(chainHash, peer, logger);

    this.queryShortIdsStrategy = new QueryShortIdsStrategy(chainHash, peer, logger);

    this.queryChannelRangeStrategy = new QueryChannelRangeStrategy(
      this.chainHash,
      this.peer,
      this.logger,
      this.queryShortIdsStrategy,
    );
  }

  public activate(start?: number, range?: number) {
    this.gossipTimeStampFilterStrategy.activate(start, range);
  }

  public deactivate() {
    this.gossipTimeStampFilterStrategy.deactivate();
  }

  public queryRange(firstBlockNum?: number, numberOfBlocks?: number) {
    this.queryChannelRangeStrategy.queryRange(firstBlockNum, numberOfBlocks);
  }
}
