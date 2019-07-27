// @ts-check

/**
 @typedef {import("@lntools/wire").ChannelAnnouncementMessage} ChannelAnnouncementMessage
 @typedef {import("./channel-settings").ChannelSettings} ChannelSettings
 @typedef {import("bn.js")} BN
*/

exports.Channel = class Channel {
  constructor() {
    /**
      @type {Buffer}
     */
    this.chainHash;

    /**
      @type {Buffer}
     */
    this.shortChannelId;

    /** @type {{ txId: string, output: number}} */
    this.channelPoint; // obtained after verifying the tx

    /**
      @type {ChannelSettings}
    */
    this.node1Settings;

    /**
     @type {ChannelSettings}
    */
    this.node2Settings;

    /** @type {Buffer} */
    this.nodeId1;

    /** @type {Buffer} */
    this.nodeId2;

    /** @type {Buffer} */
    this.bitcoinKey1;

    /** @type {Buffer} */
    this.bitcoinKey2;

    /** @type {Buffer} */
    this.nodeSignature1;

    /** @type {Buffer} */
    this.nodeSignature2;

    /** @type {Buffer} */
    this.bitcoinSignature1;

    /** @type {Buffer} */
    this.bitcoinSignature2;

    /** @type {number} */
    this.lastUpdate;

    /** @type {BN} */
    this.capacity;
  }

  /**
    Routable when nodes are known and validated and at least one
    node has broadcast its relay fees
    @type {boolean}
   */
  get isRoutable() {
    return !!this.nodeId1 && !!this.nodeId2 && !!(this.node1Settings || this.node2Settings);
  }

  /**
    Update channel settings
    @param {ChannelSettings} settings
    @returns {boolean}
   */
  updateSettings(settings) {
    if (settings.direction === 0) {
      if (this.node1Settings && this.node1Settings.timestamp > settings.timestamp) {
        return false;
      }
      this.node1Settings = settings;
      return true;
    } else {
      if (this.node2Settings && this.node2Settings.timestamp > settings.timestamp) {
        return false;
      }
      this.node2Settings = settings;
      return true;
    }
  }

  // toJSON() {
  //   return {
  //     shortChannelId: shortChannelIdString(this.shortChannelId),
  //     channelPoint: `${this.channelPoint.txId}:${this.channelPoint.output}`,
  //     nodeId1: this.nodeId1.toString('hex'),
  //     nodeId2: this.nodeId2.toString('hex'),
  //     bitcoinKey1: this.bitcoinKey1.toString('hex'),
  //     bitcoinKey2: this.bitcoinKey2.toString('hex'),
  //     nodeSignature1: this.nodeSignature1.toString('hex'),
  //     nodeSignature2: this.nodeSignature2.toString('hex'),
  //     bitcoinSignature1: this.bitcoinSignature1.toString('hex'),
  //     bitcoinSignature2: this.bitcoinSignature2.toString('hex'),
  //     capacity: this.capacity.toString(10),
  //     node1Settings: this.node1Settings.toJSON(),
  //     node2Settings: this.node2Settings.toJSON(),
  //   };
  // }

  /**
   * Constructs a channel from a node announcement message. The channel does
   * not include outpoint, capacity, or per node settings found in channel_update
   * messages. These values need to be set elsewhere.
   * @param {ChannelAnnouncementMessage} msg
   * @returns {Channel}
   */
  static fromMessage(msg) {
    let c = new Channel();
    c.shortChannelId = msg.shortChannelId;
    c.chainHash = msg.chainHash;
    c.nodeId1 = msg.nodeId1;
    c.nodeId2 = msg.nodeId2;
    c.bitcoinKey1 = msg.bitcoinKey1;
    c.bitcoinKey2 = msg.bitcoinKey2;
    c.nodeSignature1 = msg.nodeSignature1;
    c.nodeSignature2 = msg.nodeSignature2;
    c.bitcoinSignature1 = msg.bitcoinSignature1;
    c.bitcoinSignature2 = msg.bitcoinSignature2;
    return c;
  }
};
