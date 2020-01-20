import { GossipSyncStateBase } from "./gossip-sync-state-base";

export class ActiveState extends GossipSyncStateBase {
  public readonly name = "active";

  constructor({ context, logger }) {
    super({ context, logger });
    this.logger.debug("gossip sync state", this.name);
  }
}
