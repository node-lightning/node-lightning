// @ts-check

const { expect } = require('chai');
const { AddressTor3 } = require('../../lib/domain/address-tor3');

describe('AddressTor3', () => {
  /** @type {AddressTor3} */
  let sut;

  before(() => {
    sut = new AddressTor3('abcdefghijabcdefghijabcdefghij23456.onion', 9735);
  });

  it('should have type 4', () => {
    expect(sut.type).to.equal(4);
  });

  describe('.toString', () => {
    it('should return address concatinated with port', () => {
      let actual = sut.toString();
      let expected = 'abcdefghijabcdefghijabcdefghij23456.onion:9735';
      expect(actual).to.equal(expected);
    });
  });

  describe('.toJSON', () => {
    it('should return object', () => {
      let actual = sut.toJSON();
      expect(actual).to.deep.equal({
        network: 'tcp',
        address: 'abcdefghijabcdefghijabcdefghij23456.onion:9735',
      });
    });
  });
});
