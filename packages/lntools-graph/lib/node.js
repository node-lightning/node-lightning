exports.Node = class Node {
  /**
    Reperesents a node in the p2p network.
   */
  constructor() {
    /**
      @type {import("@lntools/wire").NodeAnnouncementMessage}
     */
    this.nodeAnnouncementMessage;

    /**
      @type {Buffer}
     */
    this.nodeId;

    /**
      @type {number}
     */
    this.lastUpdate;

    /**
      @type {Buffer}
     */
    this.alias;

    this.addresses;

    this.color;
  }

  /**
    Customize JSON output by converting buffers to HEX
   */
  toJSON() {
    return {
      nodeId: this.nodeId.toString('hex'),
      lastUpdate: this.lastUpdate,
      alias: this.alias ? this.alias.toString('utf8').replace(/\0/g, '') : '',
      addresses: this.addresses,
      color: this.color,
    };
  }
};
