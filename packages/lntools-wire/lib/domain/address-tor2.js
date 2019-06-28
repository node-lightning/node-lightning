// @ts-check
const { Address } = require('./address');

exports.AddressTor2 = class AddressTor2 extends Address {
  /**
    Represents an TOR v2 address with the host and port.

    @param {string} host
    @param {number} port
   */
  constructor(host, port) {
    super(host, port);
  }

  get type() {
    return 3;
  }
};
