export type PausedReadable<T> = {
    on(event: "readable", cb: any);
    read(): T;
};

export class AsyncStreamAggregator<T> {
    public streams: PausedReadable<T>[] = [];
    public reading: boolean = false;

    public constructor(
        readonly dataHandler: (source: PausedReadable<T>, data: T) => PromiseLike<void>,
    ) {}

    public add(stream: PausedReadable<T>) {
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
