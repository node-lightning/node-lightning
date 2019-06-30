// @ts-check

/**
  @typedef {import("@lntools/wire/lib/domain/address").Address} Address
 */

exports.Node = class Node {
  /**
    Reperesents a node in the p2p network.
   */
  constructor() {
    /**
      @type {import("@lntools/wire").NodeAnnouncementMessage}
     */
    this._nodeAnnouncementMessage;

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
