const winston = require('winston');
const { MESSAGE_TYPE } = require('./constants');

const typeMap = {
  // control messages
  [MESSAGE_TYPE.INIT]: require('./init-message'),
  [MESSAGE_TYPE.ERROR]: require('./error-message'),
  [MESSAGE_TYPE.PING]: require('./ping-message'),
  [MESSAGE_TYPE.PONG]: require('./pong-message'),

  // channel messages
  256: require('./channel-announcement'),
  258: require('./channel-update'),
};

function constructType(type) {
  return typeMap[type];
}

function deserialize(buffer) {
  let type = buffer.readUInt16BE();

  let Type = constructType(type);
  if (Type) return Type.deserialize(buffer);
  else winston.warn('unknown message type', type);
}

function construct(type, args) {
  let Type = constructType(type);
  return new Type(args);
}

module.exports = {
  deserialize,
  construct,
};
