import { EventEmitter } from "events";
import { Queue } from "./Queue";

/**
 * Serializes execution of events. This class is constructed with
 * a delegate function that is executed for each item that is enqueued.
 */
export class AsyncProcessingQueue<T> extends EventEmitter {
    private _fn: (...args: T[]) => Promise<void>;
    private _queue: Queue<any>;
    private _flushHandle: any;

    constructor(fn: (...args: T[]) => Promise<void>) {
        super();
        this._fn = fn;
        this._queue = new Queue();
        this._flush = this._flush.bind(this);
    }

    /**
     * Adds a new item to the processing queue
     */
    public enqueue(value: T) {
        this._queue.enqueue(value);

        // Postpone flushing until end of event loop to allow multiple operations
        // to enqueue. This handle will be cleared once flushing has completed.
        if (!this._flushHandle) this._flushHandle = setImmediate(this._flush);
    }

    /**
     * Gets the number of pending items in the processor queue
     * @type {number}
     */
    get size(): number {
        return this._queue.length;
    }

    private async _flush() {
        // emit that flushing is starting
        this.emit("flushing");

        // process all items on the queue, even items that
        // are added to the queue while flushing is occuring
        while (this._queue.length > 0) {
            try {
                const value = this._queue.dequeue();
                await this._fn(value);
            } catch (ex) {
                this.emit("error", ex);
            }
        }

        // emit flushing has completed
        this.emit("flushed");

        // clear flush handle so that next enqueue will trigger a flush
        this._flushHandle = undefined;
    }
}
