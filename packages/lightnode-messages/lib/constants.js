/**
  Defined in BOLT01
 */
const MESSAGE_TYPE = {
  // Setup and Control (0 - 31)
  INIT: 16,
  ERROR: 17,
  PING: 18,
  PONG: 19,
};

module.exports = {
  MESSAGE_TYPE,

  PONG_BYTE_THRESHOLD: 65532,
};
