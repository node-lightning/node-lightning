// @ts-check
const BufferCursor = require('@lntools/buffer-cursor');
const { ipv6StringToBuffer } = require('./ipv6-string-to-buffer');

/**
 @typedef {import("../../../lib/domain/address-ipv6").AddressIPv6} AddressIPv6
 */

exports.serializeIPv6 = serializeIPv6;

/**
  Serializes an IPv6 address in a Buffer that can be sent
  over the wire.

  @param {AddressIPv6} address
  @returns {Buffer}
 */
function serializeIPv6(address) {
  let result = Buffer.alloc(19);
  let writer = new BufferCursor(result);

  let hostBytes = ipv6StringToBuffer(address.host);

  writer.writeUInt8(address.type);
  writer.writeBytes(hostBytes);
  writer.writeUInt16BE(address.port);

  return result;
}
