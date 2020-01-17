import { GossipSyncer } from "../gossip-syncer";
import { GossipSyncStateBase } from "./gossip-sync-state-base";

export class ActiveState extends GossipSyncStateBase {
  public readonly name = "active";

  constructor(context: GossipSyncer) {
    super(context);
    this._logger.debug("gossip sync state", this.name);
  }
}
