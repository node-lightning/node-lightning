// @ts-check

/**
 * @typedef {import("@lntools/wire").ShortChannelId} ShortChannelId
 * @typedef {import("@lntools/wire").ChannelAnnouncementMessage} ChannelAnnouncementMessage
 * @typedef {import("./channel-settings").ChannelSettings} ChannelSettings
 * @typedef {import("./outpoint").OutPoint} OutPoint
 * @typedef {import("bn.js")} BN
 */

class Channel {
  constructor() {
    /**
      @type {Buffer}
     */
    this.chainHash;

    /**
      @type {ShortChannelId}
     */
    this.shortChannelId;

    /**
     * Obtained after verifying the transaction is a valid
     * channel funding transaction and is still a UTXO
     * @type {OutPoint}
     */
    this.channelPoint;

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

    /** @type {BN} */
    this.features;

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

  toJSON() {
    let c = this;
    return {
      shortChannelId: c.shortChannelId.toString(),
      channelPoint: c.channelPoint.toString(),
      nodeId1: c.nodeId1.toString('hex'),
      nodeId2: c.nodeId2.toString('hex'),
      bitcoinKey1: c.bitcoinKey1.toString('hex'),
      bitcoinKey2: c.bitcoinKey2.toString('hex'),
      nodeSignature1: c.nodeSignature1.toString('hex'),
      nodeSignature2: c.nodeSignature2.toString('hex'),
      bitcoinSignature1: c.bitcoinSignature1.toString('hex'),
      bitcoinSignature2: c.bitcoinSignature2.toString('hex'),
      features: c.features.toString(10),
      capacity: c.capacity.toString(10),
      node1Settings: c.node1Settings,
      node2Settings: c.node2Settings,
    };
  }
}

exports.Channel = Channel;
