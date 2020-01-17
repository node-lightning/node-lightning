import { GossipSyncerStateBase } from "./gossip-syncer-state";

export class PendingState extends GossipSyncerStateBase {
  constructor(context) {
    super(context);
    console.log(">>>>>>>>>>>>>>>>>>>>>", this.name);
  }

  public get name() {
    return "pending";
  }
}
