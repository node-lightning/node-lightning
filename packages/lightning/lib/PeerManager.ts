import { Peer } from "./Peer";
import { AsyncStreamAggregator } from "./";
import { IWireMessage } from "./messages/IWireMessage";
import { GossipManager } from "./gossip/GossipManager";
import { MessageType } from "./MessageType";
import { PeerState } from "./PeerState";
import { WireMessageResult } from "./WireMessageResult";

export class PeerManager {
    public afterPeerMessage: (result: WireMessageResult) => void;

    protected peers: Peer[] = [];
    protected aggregator: AsyncStreamAggregator<IWireMessage>;

    constructor(readonly gossipManager: GossipManager) {
        this.aggregator = new AsyncStreamAggregator<IWireMessage>((peer: Peer, msg: IWireMessage) =>
            this.onPeerMessage(peer, msg),
        );
    }

    public addPeer(peer: Peer) {
        this.peers.push(peer);
        this.aggregator.add(peer);

        // always attach ready handle
        peer.on("ready", () => this.onPeerReady(peer));

        // if peer is already ready then we'll short circuit that
        if (peer.state == PeerState.Ready) {
            this.onPeerReady(peer);
        }
    }

    public onPeerReady(peer: Peer) {
        this.gossipManager.onPeerReady(peer);
    }

    public async onPeerMessage(peer: Peer, msg: IWireMessage): Promise<void> {
        switch (msg.type) {
            // gossip messages
            case MessageType.ChannelAnnouncement:
            case MessageType.ChannelUpdate:
            case MessageType.NodeAnnouncement:
            case MessageType.QueryChannelRange:
            case MessageType.ReplyChannelRange:
            case MessageType.QueryShortChannelIds:
            case MessageType.ReplyShortChannelIdsEnd: {
                const result = await this.gossipManager.onWireMessage(peer, msg);
                this.afterPeerMessage(result);
            }
        }
    }
}
