// @ts-check

const { deserializeIPv4 } = require('./deserialize-ipv4');
const { deserializeIPv6 } = require('./deserialize-ipv6');
const { deserializeTor2 } = require('./deserialize-tor2');
const { deserializeTor3 } = require('./deserialize-tor3');

/**
  @typedef {import("../../domain/address").Address} Address
  @typedef {import("@lntools/buffer-cursor")} BufferCursor
 */

exports.deserializeAddress = deserializeAddress;

/**
  Deserializes an address based on the type and returns
  an instance of Address as a polymorphic type.

  @param {number} type
  @param {BufferCursor} reader
  @return {Address}
 */
function deserializeAddress(type, reader) {
  switch (type) {
    case 1:
      return deserializeIPv4(reader);
    case 2:
      return deserializeIPv6(reader);
    case 3:
      return deserializeTor2(reader);
    case 4:
      return deserializeTor3(reader);
  }
}
