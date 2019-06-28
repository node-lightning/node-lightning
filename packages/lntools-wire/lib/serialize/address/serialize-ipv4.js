// @ts-check
const BufferCursor = require('@lntools/buffer-cursor');
const { ipv4StringToBuffer } = require('./ipv4-string-to-buffer');

/**
 @typedef {import("../../../lib/domain/address-ipv4").AddressIPv4} AddressIPv4
 */

exports.serializeIPv4 = serializeIPv4;

/**
  Serializes an IPv4 address in a Buffer that can be sent
  over the wire.

  @param {AddressIPv4} address
  @returns {Buffer}
 */
function serializeIPv4(address) {
  let result = Buffer.alloc(7); // 8 bytes total
  let writer = new BufferCursor(result);

  let hostBytes = ipv4StringToBuffer(address.host);

  writer.writeUInt8(address.type);
  writer.writeBytes(hostBytes);
  writer.writeUInt16BE(address.port);

  return result;
}
