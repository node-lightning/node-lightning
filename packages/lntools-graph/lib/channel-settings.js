// @ts-check

/**
 @typedef {import("@lntools/wire").ChannelUpdateMessage} ChannelUpdateMessage
 @typedef {import("bn.js")} BN
*/

exports.ChannelSettings = class ChannelSettings {
  constructor() {
    /**
      @type {ChannelUpdateMessage}
     */
    this._channelUpdateMessage;

    /**
      @type {number}
     */
    this.direction;

    /**
      @type {number}
     */
    this.timestamp;

    /**
      @type {number}
     */
    this.cltvExpiryDelta;

    /**
      @type {BN}
     */
    this.htlcMinimumMsat;

    /**@type {BN} */
    this.htlcMaximumMsat;

    /**@type {number} */
    this.feeBaseMsat;

    /** @type {number} */
    this.feeProportionalMillionths;

    /** @type {boolean} */
    this.disabled;
  }

  /**
    @param {ChannelUpdateMessage} msg
    @returns {ChannelSettings}
   */
  static fromMsg(msg) {
    let instance = new ChannelSettings();
    instance._channelUpdateMessage = msg;
    instance.direction = msg.direction;
    instance.timestamp = msg.timestamp;
    instance.cltvExpiryDelta = msg.cltvExpiryDelta;
    instance.htlcMinimumMsat = msg.htlcMinimumMsat;
    instance.htlcMaximumMsat = msg.htlcMaximumMsat;
    instance.feeBaseMsat = msg.feeBaseMsat;
    instance.feeProportionalMillionths = msg.feeProportionalMillionths;
    instance.disabled = msg.disabled;
    return instance;
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      cltvExpiryDelta: this.cltvExpiryDelta,
      htlcMinimumMsat: this.htlcMinimumMsat.toString(10),
      htlcMaximumMsat: this.htlcMaximumMsat ? this.htlcMaximumMsat.toString(10) : undefined,
      feeBaseMsat: this.feeBaseMsat.toString(10),
      feeProportionalMillionths: this.feeProportionalMillionths.toString(10),
      disabled: this.disabled,
    };
  }
};
