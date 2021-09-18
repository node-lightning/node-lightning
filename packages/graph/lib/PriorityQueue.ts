export class PriorityQueue<T> {
    private _queue: T[];
    private _comparator: (item1: T, item2: T) => boolean;

    constructor(comparator: (item1: T, item2: T) => boolean) {
        this._queue = [];
        this._comparator = comparator;
    }

    public push(value: T) {
        this._queue.push(value);
        let pos = this._queue.length - 1;
        let parentPos = this._parentOf(pos);
        while (pos !== 0 && this._comparator(this._queue[parentPos], this._queue[pos])) {
            this._swap(pos, parentPos);
            pos = parentPos;
            parentPos = this._parentOf(pos);
        }
    }

    public top() {
        return this._queue.length > 0 ? this._queue[0] : null;
    }

    public pop() {
        if (this._queue.length === 0) {
            return null;
        }

        const item = this._queue[0];
        this._queue[0] = this._queue[this._queue.length - 1];
        this._swap(0, this._queue.length - 1);
        this._queue.pop();
        this._heapify(0);
        return item;
    }

    public size() {
        return this._queue.length;
    }

    public empty() {
        return !this._queue.length;
    }

    public toArray() {
        return [...this._queue];
    }

    public clear() {
        this._queue = [];
    }

    private _heapify(index: number) {
        const mid = Math.floor(this._queue.length / 2);
        let childIndex1: number;
        let childIndex2: number;
        let swapIndex: number;

        while (index <= mid - 1) {
            childIndex1 = 2 * index + 1;
            childIndex2 = 2 * index + 2;
            swapIndex = childIndex1;

            if (this._comparator(this._queue[childIndex1], this._queue[childIndex2])) {
                swapIndex = childIndex2;
            }

            if (this._comparator(this._queue[index], this._queue[swapIndex])) {
                this._swap(index, swapIndex);
            }

            index = swapIndex;
        }
    }

    private _swap(index1: number, index2: number) {
        const temp = this._queue[index1];
        this._queue[index1] = this._queue[index2];
        this._queue[index2] = temp;
    }

    private _parentOf(position: number) {
        return Math.floor((position - 1) / 2);
    }
}
