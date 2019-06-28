const { base32 } = require('rfc4648');

exports.torStringFromBuffer = torStringFromBuffer;

/**
  Converts a Buffer into a TOR address including the .onion suffix

  @param {Buffer} buffer
  @returns {string}
 */
function torStringFromBuffer(buffer) {
  return base32.stringify(buffer).toLowerCase() + '.onion';
}
