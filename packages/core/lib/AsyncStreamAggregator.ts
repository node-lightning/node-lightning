import { Readable } from "stream";

export class AsyncStreamAggregator<T> {
    public streams: Readable[] = [];
    public reading: boolean = false;

    public constructor(
        readonly dataHandler: (t: T) => PromiseLike<void>,
        readonly errorHandler: (e: Error) => PromiseLike<void>,
    ) {}

    public add(stream: Readable) {
        this.streams.push(stream);
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
                const data = stream.read() as T;

                // if we had data
                if (data) {
                    try {
                        await this.dataHandler(data);
                    } catch (ex) {
                        try {
                            await this.errorHandler(ex);
                        } catch (ex) {
                            // TODO figure out what to do here
                        }
                    }
                    hadData = true;
                }
            }
        }

        // reenable calls
        this.reading = false;
    }
}
