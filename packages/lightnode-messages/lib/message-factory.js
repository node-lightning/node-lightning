const winston = require('winston');

const typeMap = {
  // control messages
  16: require('./init-message'),
  17: require('./error-message'),
  18: require('./ping-message'),
  19: require('./pong-message'),

  // channel messages
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
