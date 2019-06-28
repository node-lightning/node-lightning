// @ts-check

const { Address } = require('./address');

exports.AddressIPv6 = class AddressIPv6 extends Address {
  /**
    Represents an IPv6 address with the host and port.

    @param {string} host
    @param {number} port
   */
  constructor(host, port) {
    super(host, port);
  }

  get type() {
    return 2;
  }

  toString() {
    return `[${this.host}]:${this.port}`;
  }
};
