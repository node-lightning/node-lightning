// @ts-check

const { torStringFromBuffer } = require('./tor-string-from-buffer');
const { AddressTor3 } = require('../../domain/address-tor3');

/**
  @typedef {import("@lntools/buffer-cursor")} BufferCursor
 */

exports.deserializeTor3 = deserializeTor3;

/**
  Deserializes a TOR v3 address from a BufferCursor and
  returns an instance of a AddressTor2.

  @param {BufferCursor} reader
  @return {AddressTor3}
 */
function deserializeTor3(reader) {
  let hostBytes = reader.readBytes(35);
  let port = reader.readUInt16BE();
  let host = torStringFromBuffer(hostBytes);
  return new AddressTor3(host, port);
}
