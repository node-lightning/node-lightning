// @ts-check

class LinkedListNode {
  /**
   * Creates a linked list node with the specified data
   * @param {any} value
   */
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  /**
   * Implementation of a singly linked-list that maintains both head and tail.
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
    // error when index out of range
    if (index < 0 || index > this.length) {
      throw new Error('Index out of range');
    }

    // seek until index is found
    let currentNode = this.head;
    let count = 0;
    while (count < index) {
      currentNode = currentNode.next;
      count++;
    }

    return currentNode.value;
  }

  /**
   * Removes the node at the index and returns its value.
   * Head removal is an O(1) operation. For removal of other indexes
   * is at worst O(N).
   * @param {number} index
   * @returns {any}
   */
  remove(index) {
    // error when index out of range
    if (index < 0 || index > this.length) {
      throw new Error('Index out of range');
    }

    // first node simply removes the node at the tip
    if (index === 0) {
      let node = this.head;
      let nextNode = node.next;

      this.head = nextNode;
      this.length--;
      return node.value;
    }

    // seek till we find the prior node
    let count = 0;
    let priorNode = this.head;
    while (count < index - 1) {
      priorNode = priorNode.next;
      count++;
    }

    // slice out our node,
    let node = priorNode.next;
    let nextNode = node.next;
    priorNode.next = nextNode;
    this.length--;

    // update tail
    if (priorNode.next === null) {
      this.tail = priorNode;
    }

    return node.value;
  }
}

module.exports.ListNode = LinkedListNode;
module.exports.LinkedList = LinkedList;
