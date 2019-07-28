// @ts-check

const { Channel } = require('../channel');
const { shortChannelIdFromString } = require('@lntools/wire');
const { outpointFromString } = require('./outpoint-from-string');
const { channelSettingsFromJson } = require('./channel-settings-from-json');
const BN = require('bn.js');

exports.channelFromJson = channelFromJson;

/**
 * Constructs a channel from a JSON string
 * @param {string} text
 * @returns {Channel}
 */
function channelFromJson(text) {
  let t = JSON.parse(text);
  let c = new Channel();
  c.channelPoint = outpointFromString(t.channelPoint);
  c.shortChannelId = shortChannelIdFromString(t.shortChannelId);
  c.nodeId1 = Buffer.from(t.nodeId1, 'hex');
  c.nodeId2 = Buffer.from(t.nodeId2, 'hex');
  c.bitcoinKey1 = Buffer.from(t.bitcoinKey1, 'hex');
  c.bitcoinKey2 = Buffer.from(t.bitcoinKey2, 'hex');
  c.nodeSignature1 = Buffer.from(t.nodeSignature1, 'hex');
  c.nodeSignature2 = Buffer.from(t.nodeSignature2, 'hex');
  c.capacity = new BN(t.capacity);
  c.features = new BN(t.features);
  c.node1Settings = channelSettingsFromJson(t.node1Settings);
  c.node2Settings = channelSettingsFromJson(t.node2Settings);
  return c;
}
