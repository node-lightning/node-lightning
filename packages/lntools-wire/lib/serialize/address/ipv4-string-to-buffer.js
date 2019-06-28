// @ts-check

exports.ipv4StringToBuffer = ipv4StringToBuffer;

/**
  Converts an IPv4 address in string notation to the
  byte representation.

  @param {string} host
  @returns {Buffer}
 */
function ipv4StringToBuffer(host) {
  let parts = host.split('.');
  let result = Buffer.alloc(4);
  for (let i = 0; i < 4; i++) {
    result[i] = parseInt(parts[i]);
  }
  return result;
}
