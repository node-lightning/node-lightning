import { Peer } from "./Peer";
import { LightningEvent, LightningEventQueue } from "./LightningEventQueue";
import { PeerRepository } from "./PeerRepository";

export class PeerManager {
    constructor(
        readonly peerRepository: PeerRepository,
        readonly eventQueue: LightningEventQueue,
    ) {}

    public addPeer(peer: Peer) {
        this.peerRepository.add(peer);
        peer.on("readable", () => this.eventQueue.push(LightningEvent.createPeerReadable(peer)));
        peer.on("ready", () => this.eventQueue.push(LightningEvent.createPeerReady(peer)));
        peer.on("close", () => this.eventQueue.push(LightningEvent.createPeerDisconnected(peer)));
    }
}
