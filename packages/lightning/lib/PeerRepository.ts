import { IPeer } from "./Peer";

/**
 * Maintains a list of all connected peers that we can write to.
 */
export class PeerRepository {
    public peers: IPeer[] = [];

    public add(peer: IPeer) {
        this.peers.push(peer);
    }

    public findById(peerId: string): IPeer {
        return this.peers.find(p => p.id === peerId);
    }
}
