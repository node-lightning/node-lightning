// @ts-check

class LinkedListNode {
  /**
   * Creates a linked list node with the specified data
   * @param {any} value
   */
  constructor(value) {
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LinkedList {
  /**
   * Implementation of a doubly linked-list that maintains both head and tail.
   * Tail maintenance allows for O(1) insertions at tail
   */
  constructor() {
    /** @type {number} */
    this.length = 0;

    /** @type {LinkedListNode} */
    this.head = null;

    /** @type {LinkedListNode} */
    this.tail = null;
  }

  /**
   * Adds a node to the end of a linked List
   * @param {any} value
   * @returns {LinkedListNode}
   */
  add(value) {
    let node = new LinkedListNode(value);

    // when empty list
    if (!this.head) {
      this.head = node;
      this.tail = node;
      this.length++;
      return node;
    }

    // non-empty, append to tail
    node.prev = this.tail;
    this.tail.next = node;
    this.tail = node;
    this.length++;
    return node;
  }

  /**
   * Finds the node at a specific position
   * @param {number} index
   * @returns {any}
   */
  valueAt(index) {
    let node = this.nodeAt(index);
    return node.value;
  }

  /**
   * Finds the node for the index or throws an out of range exception
   * @param {number} index
   * @returns {LinkedListNode}
   */
  nodeAt(index) {
    // error when index out of range
    if (index < 0 || index > this.length) {
      throw new RangeError('Index out of range');
    }

    // seek until index is found
    let currentNode = this.head;
    let count = 0;
    while (count < index) {
      currentNode = currentNode.next;
      count++;
    }

    return currentNode;
  }

  /**
   * Removes the node at the index and returns its value.
   * Head or tail removal is an O(1) operation. For removal of other indexes
   * is at worst O(N).
   * @param {number} index
   * @returns {any} value of the node
   */
  remove(index) {
    // error when index out of range
    if (index < 0 || index > this.length) {
      throw new RangeError('Index out of range');
    }

    let removeNode;
    let prevNode = null;
    let nextNode = null;

    // first node simply removes the node at the tip
    if (index === 0) {
      removeNode = this.head;
      nextNode = this.head.next;

      // adjust head
      this.head = nextNode;
    }

    // last node, update the tail and mark next as null
    if (index === this.length - 1) {
      removeNode = this.tail;
      prevNode = this.tail.prev;

      // adjust tail
      this.tail = prevNode;
    }

    // middle node
    if (!removeNode) {
      removeNode = this.nodeAt(index);
      prevNode = removeNode.prev;
      nextNode = removeNode.next;
    }

    // splice out the node afer null checking
    if (prevNode) prevNode.next = nextNode;
    if (nextNode) nextNode.prev = prevNode;
    this.length--;

    return removeNode.value;
  }
}

module.exports.ListNode = LinkedListNode;
module.exports.LinkedList = LinkedList;
