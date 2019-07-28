// @ts-check

const BN = require('bn.js');
const { ChannelSettings } = require('../channel-settings');

exports.channelSettingsFromJson = channelSettingsFromJson;

/**
 * Parses ChannelSettings from JSON serialization.
 * @param {string} text
 * @returns {ChannelSettings}
 */
function channelSettingsFromJson(text) {
  let t = JSON.parse(text);
  let s = new ChannelSettings();
  s.timestamp = t.timestamp;
  s.htlcMinimumMsat = new BN(s.htlcMinimumMsat);
  s.htlcMaximumMsat = s.htlcMaximumMsat ? new BN(s.htlcMaximumMsat) : undefined;
  s.feeBaseMsat = parseInt(t.feeBaseMsat);
  s.feeProportionalMillionths = parseInt(t.feeProportionalMillionths);
  s.disabled = t.disabled;
  return s;
}
