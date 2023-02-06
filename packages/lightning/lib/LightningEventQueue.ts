import { LightningEvent } from "./LightningEvent";
import { LightningEventType } from "./LightningEventType";
import { ILightningEventMuxer } from "./ILightningEventMuxer";

/**
 * Serializes all lightning events types into a single queue processing
 * queue to get processed by an event multiplexer. Functionally enables
 * us to block stream and event-based code while async-await code
 * completes.
 *
 * This queue takes stream (peer messages), connection events, blocks
 * events, etc and processes each from round robin queue of the events.
 *
 * Peer messages avoid bloating the queue by pushing a single read event
 * onto the queue (and requeuing after a successful read).
 *
 * One queue *could* be constructed per-peer, but to ease the burden of
 * development we're going to use a single queue for the system.
 */
export class LightningEventQueue {
    public reading: boolean = false;
    public processing: boolean = false;

    public queue: LightningEvent[] = [];
    public flushed: () => void;

    constructor(readonly muxer: ILightningEventMuxer) {}

    /**
     * Pushes an event onto the processing FIFO queue.
     * @param event
     */
    public push(event: LightningEvent) {
        this.queue.push(event);
        void this.process();
    }

    protected async process() {
        // ignore if already processing
        if (this.processing) return;

        // ignore if queue length is zero
        if (this.queue.length === 0) {
            if (this.flushed) {
                this.flushed();
            }
            return;
        }

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
                        const event2 = new LightningEvent(LightningEventType.PeerMessage);
                        event2.peer = event.peer;
                        event2.msg = msg;

                        await this.muxer.onEvent(event2);
                    }
                    break;
                }

                default:
                    await this.muxer.onEvent(event);
                    break;
            }
        } catch (ex) {
            // TODO
        } finally {
            this.processing = false;

            // try to process next message
            void this.process();
        }
    }
}
export { LightningEvent };
