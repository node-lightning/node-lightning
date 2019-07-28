// @ts-check

/**
 * @typedef {import("bn.js")} BN
 */

exports.ChannelSettings = class ChannelSettings {
  constructor() {
    /**
     * @type {Buffer}
     */
    this.signature;

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

  toJSON() {
    return {
      signature: this.signature.toString('hex'),
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
