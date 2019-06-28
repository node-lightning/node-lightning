// @ts-check
const { Address } = require('./address');

exports.AddressIPv4 = class AddressIPv4 extends Address {
  /**
    Represents an IPv4 address with the host and port.

    @param {string} host
    @param {number} port
   */
  constructor(host, port) {
    super(host, port);
  }

  get type() {
    return 1;
  }

  toString() {
    return `${this.host}:${this.port}`;
  }
};
