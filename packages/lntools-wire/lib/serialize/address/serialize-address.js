// @ts-check

const { serializeIPv4 } = require('./serialize-ipv4');
const { serializeIPv6 } = require('./serialize-ipv6');
const { serializeTor2 } = require('./serialize-tor2');
const { serializeTor3 } = require('./serialize-tor3');

/**
  @typedef {import("../../../lib/domain/address").Address} Address
 */

exports.serializeAddress = serializeAddress;

/**
  Serializes an address into a Buffer that can be transmitted
  over the wire

  @param {Address} address
  @return {Buffer}
 */
function serializeAddress(address) {
  switch (address.type) {
    case 1:
      return serializeIPv4(address);
    case 2:
      return serializeIPv6(address);
    case 3:
      return serializeTor2(address);
    case 4:
      return serializeTor3(address);
  }
}
