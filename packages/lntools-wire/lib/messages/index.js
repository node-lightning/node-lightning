module.exports = {
  /** @type InitMessage */
  InitMessage: require('./init-message'),

  /** @type ErrorMessage */
  ErrorMessage: require('./error-message'),

  /** @type PingMessage */
  PingMessage: require('./ping-message'),

  /** @type PongMessage */
  PongMessage: require('./pong-message'),

  // AnnouncementSignaturesMessage: require('./announcement-signatures-message'),
  ChannelAnnouncementMessage: require('./channel-announcement-message'),
  ChannelUpdateMessage: require('./channel-update-message'),
  NodeAnnouncementMessage: require('./node-announcement-message'),
};
