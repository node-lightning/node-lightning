// @ts-check

const BufferCursor = require('simple-buffer-cursor');

exports.ipv6StringToBuffer = ipv6StringToBuffer;

/**
  Converts an IPv6 address in string notation to the
  byte representation.

  @param {string} host
  @returns {Buffer}
 */
function ipv6StringToBuffer(host) {
  // replace start or end expansion with single part to retain correct
  // number of parts (8) that are used in the remainder of the logic.
  // ie: ::1:2:3:4:5:6:7 would split to ['','',1,2,3,4,5,6,7] and
  // result in overflows
  if (host.startsWith('::')) host = host.substr(1);
  else if (host.endsWith('::')) host = host.substr(0, host.length - 1);

  let parts = host.split(':');

  let result = Buffer.alloc(16);
  let writer = BufferCursor.from(result);

  let expandBy = 8 - parts.length;
  let needsExpansion = expandBy > 0;

  for (let part of parts) {
    if (needsExpansion && part == '') {
      let b = Buffer.alloc((expandBy + 1) * 2);
      writer.writeBytes(b);
      needsExpansion = false;
    } else {
      let b = Buffer.from(expandZeros(part), 'hex');
      writer.writeBytes(b);
    }
  }

  return result;
}

/**
  @private
  @param {string} part
  @returns {string}
 */
function expandZeros(part) {
  return part.padStart(4, '0');
}
