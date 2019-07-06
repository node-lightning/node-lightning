const { LinkedList } = require('../lib/linked-list');

class Queue {
  /**
   * FIFO queue implemented with a Linked List with O(1) enqueu and d
   */
  constructor() {
    /** @private */
    this._list = new LinkedList();
  }

  /**
   * Peak the tip value
   * @type {any}
   */
  peak() {
    return this._list.head && this._list.head.value;
  }

  /**
   * Returns the length of the queue
   * @type {number}
   */
  get length() {
    return this._list.length;
  }

  /**
   * Enqueue a value
   * @param {any} value
   */
  enqueue(value) {
    this._list.add(value);
  }

  /**
   * Dequeue top most value
   * @returns {any}
   */
  dequeue() {
    return this._list.remove(0);
  }
}

exports.Queue = Queue;
