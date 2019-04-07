const winston = require('winston');
const { MESSAGE_TYPE } = require('./constants');
const messages = require('./messages');

const typeMap = {
  // control messages
  [MESSAGE_TYPE.INIT]: messages.InitMessage,
  [MESSAGE_TYPE.ERROR]: messages.ErrorMessage,
  [MESSAGE_TYPE.PING]: messages.PingMessage,
  [MESSAGE_TYPE.PONG]: messages.PongMessage,

  // channel messages
  [MESSAGE_TYPE.ANNOUNCEMENT_SIGNATURES]: messages.AnnouncementSignaturesMessage,
  [MESSAGE_TYPE.NODE_ANNOUNCEMENT]: messages.NodeAnnouncementMessage,
  [MESSAGE_TYPE.CHANNEL_ANNOUNCEMENT]: messages.ChannelAnnouncementMessage,
  [MESSAGE_TYPE.CHANNEL_UPDATE]: messages.ChannelUpdateMessage,
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
