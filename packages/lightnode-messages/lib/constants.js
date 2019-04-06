/**
  Defined in BOLT01
 */
const MESSAGE_TYPE = {
  // Setup and Control (0 - 31)
  INIT: 16,
  ERROR: 17,
  PING: 18,
  PONG: 19,

  // Channel (32-127)

  // Commitment (128-255)

  // Routing (256-511)
  CHANNEL_ANNOUNCEMENT: 256,
  ANNOUNCEMENT_SIGNATURES: 259,
};

module.exports = {
  MESSAGE_TYPE,

  PONG_BYTE_THRESHOLD: 65532,
};
