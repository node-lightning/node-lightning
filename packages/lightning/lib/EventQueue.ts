import { Block } from "@node-lightning/bitcoin";
import { IWireMessage } from "./messages/IWireMessage";
import { IPeer } from "./Peer";

export enum LightningEventType {
    PeerReady,
    PeerDisconnected,
    PeerReadable,
    PeerMessage,
    BlockConnected,
    BlockDisconnected,
}

export class LightningEvent {
    public type: LightningEventType;
    public peer: IPeer;
    public msg: IWireMessage;
    public block: Block;
}

export class EventQueue {
    public reading: boolean = false;
    public processing: boolean = false;

    public queue: LightningEvent[];

    public constructor(readonly eventHandler: (event: LightningEvent) => PromiseLike<void>) {}

    public addPeer(peer: IPeer) {
        peer.on("readable", () => this.onPeerReadable(peer));
        peer.on("ready", () => this.onPeerReady(peer));
        peer.on("close", () => this.onPeerDisconnected(peer));
    }

    protected onPeerReadable(peer: IPeer) {
        const event = new LightningEvent();
        event.type = LightningEventType.PeerReadable;
        event.peer = peer;
        this.queue.push(event);
        void this.process();
    }

    protected onPeerReady(peer: IPeer) {
        const event = new LightningEvent();
        event.type = LightningEventType.PeerReady;
        event.peer = peer;
        this.queue.push(event);
        void this.process();
    }

    protected onPeerDisconnected(peer: IPeer) {
        const event = new LightningEvent();
        event.type = LightningEventType.PeerDisconnected;
        event.peer = peer;
        this.queue.push(event);
        void this.process();
    }

    protected async process() {
        // ignore if already processing
        if (this.processing) return;

        // ignore if queue length is zero
        if (this.queue.length === 0) return;

        // flag that we are processing
        this.processing = true;

        const event = this.queue.shift();

        try {
            switch (event.type) {
                case LightningEventType.PeerReadable: {
                    // attempt to read from the peer, if we don't get a
                    // message than the peer buffer is empty. This will
                    // happen because we re-enqueue the readable event
                    // for a peer after each successful read. This ensures
                    // that other event type can be processed.
                    const msg = event.peer.read();
                    if (msg) {
                        // re-add incase there is more data in the stream
                        this.queue.push(event);

                        // construct a new wire msg event and supply it
                        // to the handler
                        const event2 = new LightningEvent();
                        event2.type = LightningEventType.PeerMessage;
                        event2.peer = event.peer;
                        event2.msg = msg;
                        await this.eventHandler(event);
                    }
                    break;
                }

                case LightningEventType.BlockConnected:
                case LightningEventType.BlockDisconnected:
                case LightningEventType.PeerDisconnected:
                case LightningEventType.PeerReady:
                    await this.eventHandler(event);
            }
        } catch (ex) {
            // todo call error handler
        }
    }
}
