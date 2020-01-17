import { GossipSyncer } from "../gossip-syncer";
import { GossipSyncerStateBase } from "./gossip-syncer-state";

export class GossipSyncedState extends GossipSyncerStateBase {
  constructor(context: GossipSyncer) {
    super(context);
    console.log(">>>>>>>>>>>>>>>>>>>>>", this.name);
  }

  get name() {
    return "gossip synced";
  }
}
