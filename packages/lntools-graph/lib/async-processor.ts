import { EventEmitter } from "events";
import { Queue } from "./queue";

export class AsyncProcessor extends EventEmitter {
  private _fn: (any: any) => Promise<any>;
  private _queue: Queue<any>;
  private _flushHandle: any;

  /**
   * Serialized execution of asynchronous functions
   */
  constructor(fn: (a: any) => Promise<any>) {
    super();
    this._fn = fn;
    this._queue = new Queue();
    this._flush = this._flush.bind(this);
  }

  /**
   *
   */
  public enqueue(value: any) {
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
        const a = await this._fn(value);
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
