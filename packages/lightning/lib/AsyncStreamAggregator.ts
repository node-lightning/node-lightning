import { IPausedReadable } from "./IPausedReadable";

/**
 * The purpose of this class is to serialize the processing of multiple
 * read streams and make data processing compatible with async handlers
 * while retaining the backpressure capabilities of the read streams. In
 * a nutshell, this class converts event-based code into async compatible
 * code.
 *
 * This class works by merging two or more paused readable streams and
 * performs round-robin read operations on the streams. Each piece of
 * read data triggers the async data handler.
 */
export class AsyncStreamAggregator<T> {
    public streams: IPausedReadable<T>[] = [];
    public reading: boolean = false;

    public constructor(
        readonly dataHandler: (source: IPausedReadable<T>, data: T) => PromiseLike<void>,
    ) {}

    /**
     * Adds a stream to the aggregator which will
     * be served in round-robin order.
     * @param stream
     */
    public add(stream: IPausedReadable<T>) {
        this.streams.push(stream);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        stream.on("readable", this.onData.bind(this));
    }

    /**
     * Called when any of the streams have data available. It's goal is
     * to read round-robin from all streams until no more data exists.
     * @returns
     */
    protected async onData() {
        // ignore if we're already reading
        if (this.reading) return;

        // block subsequent calls
        this.reading = true;

        // read until no more data has been found
        let hadData = true;
        while (hadData) {
            hadData = false;

            // round-robin streams based on attachment
            for (const stream of this.streams) {
                const data = stream.read();

                // Data handler must not throw errors
                if (data) {
                    await this.dataHandler(stream, data);
                    hadData = true;
                }
            }
        }

        // reenable calls
        this.reading = false;
    }
}
