// @ts-check

const { torStringFromBuffer } = require('./tor-string-from-buffer');
const { AddressTor2 } = require('../../domain/address-tor2');

/**
  @typedef {import("@lntools/buffer-cursor")} BufferCursor
 */

exports.deserializeTor2 = deserializeTor2;

/**
  Deserializes a TOR v2 address from a BufferCursor and
  returns an instance of a AddressTor2.

  @param {BufferCursor} reader
  @return {AddressTor2}
 */
function deserializeTor2(reader) {
  let hostBytes = reader.readBytes(10);
  let port = reader.readUInt16BE();
  let host = torStringFromBuffer(hostBytes);
  return new AddressTor2(host, port);
}
