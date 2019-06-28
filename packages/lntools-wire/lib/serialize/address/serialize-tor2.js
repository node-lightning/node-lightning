// @ts-check
const BufferCursor = require('simple-buffer-cursor');
const { torStringToBuffer } = require('./tor-string-to-buffer');

/**
 @typedef {import("../../../lib/domain/address-tor2").AddressTor2} AddressTor2
 */

exports.serializeTor2 = serializeTor2;

/**
  Serializes a Tor v2 address in a Buffer that can be sent
  over the wire.

  @param {AddressTor2} address
  @returns {Buffer}
 */
function serializeTor2(address) {
  let result = Buffer.alloc(13);
  let writer = BufferCursor.from(result);

  let hostBytes = torStringToBuffer(address.host);

  writer.writeUInt8(address.type);
  writer.writeBytes(hostBytes);
  writer.writeUInt16BE(address.port);

  return result;
}
