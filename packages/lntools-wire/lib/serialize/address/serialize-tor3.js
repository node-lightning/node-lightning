// @ts-check
const BufferCursor = require('simple-buffer-cursor');
const { torStringToBuffer } = require('./tor-string-to-buffer');

/**
 @typedef {import("../../../lib/domain/address-tor3").AddressTor3} AddressTor3
 */

exports.serializeTor3 = serializeTor3;

/**
  Serializes a Tor v3 address in a Buffer that can be sent
  over the wire.

  @param {AddressTor3} address
  @returns {Buffer}
 */
function serializeTor3(address) {
  let result = Buffer.alloc(38);
  let writer = BufferCursor.from(result);

  let hostBytes = torStringToBuffer(address.host);

  writer.writeUInt8(address.type);
  writer.writeBytes(hostBytes);
  writer.writeUInt16BE(address.port);

  return result;
}
