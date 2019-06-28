// @ts-check

const { ipv4StringFromBuffer } = require('./ipv4-string-from-buffer');
const { AddressIPv4 } = require('../../domain/address-ipv4');

/**
  @typedef {import("simple-buffer-cursor/src/buffer-cursor")} BufferCursor
*/

exports.deserializeIPv4 = deserializeIPv4;

/**
  Deserializes an IPv4 address from a BufferCursor and
  returns an instance of an IPv4 Address.

  @param {BufferCursor} reader
  @returns {AddressIPv4}
 */
function deserializeIPv4(reader) {
  let hostBytes = reader.readBytes(4);
  let port = reader.readUInt16BE();
  let host = ipv4StringFromBuffer(hostBytes);
  return new AddressIPv4(host, port);
}
