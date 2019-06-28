// @ts-check

const { expect } = require('chai');
const { AddressIPv4 } = require('../../lib/domain/address-ipv4');

describe('AddressIPv4', () => {
  /** @type {AddressIPv4} */
  let sut;

  before(() => {
    sut = new AddressIPv4('127.0.0.1', 9735);
  });

  it('should have type 1', () => {
    expect(sut.type).to.equal(1);
  });

  describe('.toString', () => {
    it('should return address concatinated with port', () => {
      let actual = sut.toString();
      let expected = '127.0.0.1:9735';
      expect(actual).to.equal(expected);
    });
  });

  describe('.toJSON', () => {
    it('should return object', () => {
      let actual = sut.toJSON();
      expect(actual).to.deep.equal({
        network: 'tcp',
        address: '127.0.0.1:9735',
      });
    });
  });
});
