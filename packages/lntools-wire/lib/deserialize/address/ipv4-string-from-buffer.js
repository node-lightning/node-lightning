// @ts-check

exports.ipv4StringFromBuffer = ipv4StringFromBuffer;

/**
  Converts an IPv4 address into string notation
  of the format x.x.x.x where each x is an 8-bit integer.

  @param {Buffer} bytes
  @return {string}
 */
function ipv4StringFromBuffer(bytes) {
  return bytes.join('.');
}
