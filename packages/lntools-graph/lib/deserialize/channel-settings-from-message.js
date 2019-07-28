// @ts-check

const { ChannelSettings } = require('../channel-settings');

/**
 * @typedef {import("@lntools/wire").ChannelUpdateMessage} ChannelUpdateMessage
 * @typedef {import("bn.js")} BN
 */

exports.channelSettingsFromMessage = channelSettingsFromMessage;

/**
 * @param {ChannelUpdateMessage} msg
 * @returns {ChannelSettings}
 */
function channelSettingsFromMessage(msg) {
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
