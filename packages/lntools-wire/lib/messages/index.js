module.exports = {
  ...require('./init-message'),
  ...require('./error-message'),
  ...require('./ping-message'),
  ...require('./pong-message'),

  ...require('./channel-announcement-message'),
  ...require('./channel-update-message'),
  ...require('./node-announcement-message'),
};
