// @ts-check

const { AddressIPv6 } = require('../../domain/address-ipv6');
const { ipv6StringFromBuffer } = require('./ipv6-string-from-buffer');

/**
  @typedef {import("simple-buffer-cursor/src/buffer-cursor")} BufferCursor
 */

exports.deserializeIPv6 = deserializeIPv6;

/**
  Deserializes an IPv6 address from a BufferCursor and
  returns an instance of an IPv6 Address.

  @param {BufferCursor} reader
  @return {AddressIPv6}
 */
function deserializeIPv6(reader) {
  let hostBytes = reader.readBytes(16);
  let port = reader.readUInt16BE();
  let host = ipv6StringFromBuffer(hostBytes);
  return new AddressIPv6(host, port);
}
