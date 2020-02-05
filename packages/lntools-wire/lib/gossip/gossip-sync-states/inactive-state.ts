import { GossipSyncer } from "../gossip-syncer";
import { IGossipSyncState } from "./gossip-sync-state";

export class InactiveState implements IGossipSyncState {
  public readonly name = "inactive";
}
