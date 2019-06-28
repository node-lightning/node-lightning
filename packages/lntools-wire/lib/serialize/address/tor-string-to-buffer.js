// @ts-check

const { base32 } = require('rfc4648');

exports.torStringToBuffer = torStringToBuffer;

/**
  Converts a Tor address in string notation into a Buffer

  @param {string} host
  @returns {Buffer}
 */
function torStringToBuffer(host) {
  host = host.substr(0, host.indexOf('.'));
  host = host.toUpperCase();
  return Buffer.from(base32.parse(host));
}
