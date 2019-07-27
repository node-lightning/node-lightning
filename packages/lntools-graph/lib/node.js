// @ts-check

/**
 * @typedef {import("bn.js")} BN
 * @typedef {import("./channel").Channel} Channel
 * @typedef {import("@lntools/wire").NodeAnnouncementMessage} NodeAnnouncementMessage
 * @typedef {import("@lntools/wire/lib/domain/address").Address} Address
 */

exports.Node = class Node {
  /**
    Reperesents a node in the p2p network.
   */
  constructor() {
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

    /**
      @type {Array<Address>}
     */
    this.addresses;

    /**
      @type {Buffer}
     */
    this.rgbColor;

    /**
     * @type {Buffer}
     */
    this.nodeSignature;

    /**
     * @type {BN}
     */
    this.features;

    /**
     * List of channels the node belongs to
     * @type {Map<string, Channel>}
     */
    this.channels = new Map();
  }

  /**
    Gets the alias as human readable string
    @type {string}
   */
  get aliasString() {
    return this.alias ? this.alias.toString('utf8').replace(/\0/g, '') : '';
  }

  /**
    Gets the color as a an RGB color string
    @type {string}
   */
  get rgbColorString() {
    return this.rgbColor ? '#' + this.rgbColor.toString('hex') : '';
  }

  /**
   * Adds a channel to the node's channel list
   * @param {Channel} channel
   */
  linkChannel(channel) {
    let id = channel.shortChannelId.toString('hex');
    this.channels.set(id, channel);
  }

  /**
   * Remove a channel from the node's channel list
   * @param {Channel} channel
   */
  unlinkChannel(channel) {
    let id = channel.shortChannelId.toString('hex');
    this.channels.delete(id);
  }

  /**
    Customize JSON output by converting buffers to HEX
   */
  toJSON() {
    return {
      nodeId: this.nodeId.toString('hex'),
      lastUpdate: this.lastUpdate,
      alias: this.aliasString,
      addresses: this.addresses,
      rgbColor: this.rgbColorString,
    };
  }
};
