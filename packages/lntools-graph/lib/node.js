class Node {
  /**
    Reperesents a node in the p2p network.
   */
  constructor() {
    /**
      Hex-encdoed compressed public for the node.

      @type {string}
     */
    this.nodeId;

    /**
      @type {number}
     */
    this.lastUpdate;

    /**
      @type {string}
     */
    this.alias;

    this.addresses;
    this.color;

    this.updates = [];
  }
}

module.exports = Node;
