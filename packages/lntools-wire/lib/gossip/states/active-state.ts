import { IGossipSyncState } from "./gossip-sync-state";

export class ActiveState implements IGossipSyncState {
  public readonly name = "active";
}
