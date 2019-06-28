// @ts-check

const { expect } = require('chai');
const { AddressTor2 } = require('../../lib/domain/address-tor2');

describe('AddressTor2', () => {
  /** @type {AddressTor2} */
  let sut;

  before(() => {
    sut = new AddressTor2('abcdefghij.onion', 9735);
  });

  it('should have type 3', () => {
    expect(sut.type).to.equal(3);
  });

  describe('.toString', () => {
    it('should return address concatinated with port', () => {
      let actual = sut.toString();
      let expected = 'abcdefghij.onion:9735';
      expect(actual).to.equal(expected);
    });
  });

  describe('.toJSON', () => {
    it('should return object', () => {
      let actual = sut.toJSON();
      expect(actual).to.deep.equal({
        network: 'tcp',
        address: 'abcdefghij.onion:9735',
      });
    });
  });
});
