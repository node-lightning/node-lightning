// @ts-check
const { Address } = require('./address');

exports.AddressTor3 = class AddressTor3 extends Address {
  /**
    Represents an Tor v3 address with the host and port.

    @param {string} host
    @param {number} port
   */
  constructor(host, port) {
    super(host, port);
  }

  get type() {
    return 4;
  }
};
