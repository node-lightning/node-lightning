export class LinkedListNode<T> {
    public value: T;
    public prev: LinkedListNode<T>;
    public next: LinkedListNode<T>;

    /**
     * Creates a linked list node with the specified data
     */
    constructor(value: T) {
        this.value = value;
        this.prev = null;
        this.next = null;
    }
}
