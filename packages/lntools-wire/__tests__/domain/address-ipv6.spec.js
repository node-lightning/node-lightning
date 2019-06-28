// @ts-check

const { expect } = require('chai');
const { AddressIPv6 } = require('../../lib/domain/address-ipv6');

describe('AddressIPv6', () => {
  /** @type {AddressIPv6} */
  let sut;

  before(() => {
    sut = new AddressIPv6('::1', 9735);
  });

  it('should have type 2', () => {
    expect(sut.type).to.equal(2);
  });

  describe('.toString', () => {
    it('should return address concatinated with port', () => {
      let actual = sut.toString();
      let expected = '[::1]:9735';
      expect(actual).to.equal(expected);
    });
  });

  describe('.toJSON', () => {
    it('should return object', () => {
      let actual = sut.toJSON();
      expect(actual).to.deep.equal({
        network: 'tcp',
        address: '[::1]:9735',
      });
    });
  });
});
