import { LinkedList } from "./LinkedList";

/**
 * FIFO queue implemented with O(1) enqueue and dequeue operations
 */
export class Queue<T> {
    private _list: LinkedList<T> = new LinkedList<T>();

    /**
     * Peak the tip value
     */
    public peak(): T {
        return this._list.head && this._list.head.value;
    }

    /**
     * Returns the length of the queue
     */
    get length(): number {
        return this._list.length;
    }

    /**
     * Enqueue a value
     */
    public enqueue(value: T) {
        this._list.add(value);
    }

    /**
     * Dequeue top most value
     */
    public dequeue(): T {
        return this._list.remove(0);
    }
}
