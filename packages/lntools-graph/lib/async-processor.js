// @ts-check
const { EventEmitter } = require('events');
const { Queue } = require('./queue');

class AsyncProcessor extends EventEmitter {
  /**
   * Serialized execution of asynchronous functions
   * @param {(any) => Promise<any>} fn
   */
  constructor(fn) {
    super();
    this._fn = fn;
    this._queue = new Queue();
    this._flush = this._flush.bind(this);
    this._flushHandle;
  }

  /**
   *
   * @param {any} value
   */
  enqueue(value) {
    this._queue.enqueue(value);

    // Postpone flushing until end of event loop to allow multiple operations
    // to enqueue. This handle will be cleared once flushing has completed.
    if (!this._flushHandle) this._flushHandle = setImmediate(this._flush);
  }

  /**
   * Gets the number of pending items in the processor queue
   * @type {number}
   */
  get size() {
    return this._queue.length;
  }

  async _flush() {
    // emit that flushing is starting
    this.emit('flushing');

    // process all items on the queue, even items that
    // are added to the queue while flushing is occuring
    while (this._queue.length > 0) {
      try {
        let value = this._queue.dequeue();
        let a = await this._fn(value);
        this.terd = a;
      } catch (ex) {
        this.emit('error', ex);
      }
    }

    // emit flushing has completed
    this.emit('flushed');

    // clear flush handle so that next enqueue will trigger a flush
    this._flushHandle = undefined;
  }
}

exports.AsyncProcessor = AsyncProcessor;
