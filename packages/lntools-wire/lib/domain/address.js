exports.Address = class Address {
  /**
    Base class representing a network address

    @param {string} host
    @param {number} port
   */
  constructor(host, port) {
    /**
      String notation representation of the host

      @type {string}
    */
    this.host = host;

    /**
      Port number

      @type {number}
    */
    this.port = port;
  }

  /**
    Type of connection

    @type {number}
   */
  get type() {
    throw new Error('Not implemented');
  }

  toString() {
    return `${this.host}:${this.port}`;
  }

  toJSON() {
    return {
      network: 'tcp',
      address: this.toString(),
    };
  }
};
