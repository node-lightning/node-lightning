const winston = require('winston');
const { MESSAGE_TYPE } = require('./constants');
const { InitMessage } = require('./messages/init-message');
const { ErrorMessage } = require('./messages/error-message');
const { PingMessage } = require('./messages/ping-message');
const { PongMessage } = require('./messages/pong-message');
const { NodeAnnouncementMessage } = require('./messages/node-announcement-message');
const { ChannelAnnouncementMessage } = require('./messages/channel-announcement-message');
const { ChannelUpdateMessage } = require('./messages/channel-update-message');

const typeMap = {
  // control messages
  [MESSAGE_TYPE.INIT]: InitMessage,
  [MESSAGE_TYPE.ERROR]: ErrorMessage,
  [MESSAGE_TYPE.PING]: PingMessage,
  [MESSAGE_TYPE.PONG]: PongMessage,

  // channel messages
  // [MESSAGE_TYPE.ANNOUNCEMENT_SIGNATURES]: messages.AnnouncementSignaturesMessage,
  [MESSAGE_TYPE.NODE_ANNOUNCEMENT]: NodeAnnouncementMessage,
  [MESSAGE_TYPE.CHANNEL_ANNOUNCEMENT]: ChannelAnnouncementMessage,
  [MESSAGE_TYPE.CHANNEL_UPDATE]: ChannelUpdateMessage,
};

function constructType(type) {
  return typeMap[type];
}

function deserialize(buffer) {
  let type = buffer.readUInt16BE();

  let Type = constructType(type);
  if (Type) return Type.deserialize(buffer);
  else winston.warn('unknown message type ' + type);
}

function construct(type, args) {
  let Type = constructType(type);
  return new Type(args);
}

module.exports = {
  deserialize,
  construct,
};
