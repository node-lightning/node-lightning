import { GossipSyncer } from "../gossip-syncer";
import { GossipSyncStateBase } from "./gossip-sync-state-base";

export class InactiveState extends GossipSyncStateBase {
  public readonly name = "inactive";

  constructor(context: GossipSyncer) {
    super(context);
    this._logger.debug("gossip sync state", this.name);
  }
}
