// @ts-check

const { shortChannelIdNumber } = require('@lntools/wire');

/**
 @typedef {import("@lntools/wire").ChannelAnnouncementMessage} ChannelAnnouncementMessage
 @typedef {import("./channel-settings").ChannelSettings} ChannelSettings
 @typedef {import("bn.js")} BN
*/

exports.Channel = class Channel {
  constructor() {
    /**
      @type {ChannelAnnouncementMessage}
     */
    this._channelAnnouncmentMessage;

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
    return {
      shortChannelId: shortChannelIdNumber(this.shortChannelId),
      channelPoint: `${this.channelPoint.txId}:${this.channelPoint.output}`,
      nodeId1: this.nodeId1.toString('hex'),
      nodeId2: this.nodeId2.toString('hex'),
      capacity: this.capacity.toString(10),
      node1Settings: this.node1Settings.toJSON(),
      node2Settings: this.node2Settings.toJSON(),
    };
  }
};
