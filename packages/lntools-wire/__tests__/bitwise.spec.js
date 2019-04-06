const { expect } = require('chai');
const BN = require('bn.js');
const bitwise = require('../lib/bitwise');

describe('.maskn', () => {
  it('should throw below zero', () => {
    expect(() => bitwise.maskn(-1)).to.throw();
  });

  it('should mask zero', () => {
    let result = bitwise.maskn(0).toNumber();
    expect(result).to.equal(1);
  });

  it('should mask one', () => {
    let result = bitwise.maskn(1).toNumber();
    expect(result).to.equal(2);
  });

  it('should mask small bit', () => {
    let result = bitwise.maskn(5).toNumber();
    expect(result).to.equal(32);
  });

  it('should mask larger bit than native supports', () => {
    let result = bitwise.maskn(33).toString();
    let expected = new BN(2).pow(new BN(33)).toString();
    expect(result).to.equal(expected);
  });

  it('should mask for very big number', () => {
    let result = bitwise.maskn(3000).toString();
    let expected = new BN(2).pow(new BN(3000)).toString();
    expect(result).to.equal(expected);
  });
});

describe('.isetn', () => {
  it('should throw when flags is not a BN', () => {
    expect(() => bitwise.isetn(47, 5)).to.throw();
  });

  it('should set a bit that doesnt exist', () => {
    let flags = new BN(4);
    bitwise.isetn(flags, 1);
    expect(flags.toNumber()).to.equal(6);
  });

  it('should set a bit that already exists', () => {
    let flags = new BN(4);
    bitwise.isetn(flags, 2);
    expect(flags.toNumber()).to.equal(4);
  });
});

describe('.iunsetn', () => {
  it('should throw when flags is not a BN', () => {
    expect(() => bitwise.iunsetn(47, 5)).to.throw();
  });

  it('should remove a bit that doesnt exist', () => {
    let flags = new BN(4);
    bitwise.iunsetn(flags, 1);
    expect(flags.toNumber()).to.equal(4);
  });

  it('should remove a bit that does exist', () => {
    let flags = new BN(7);
    bitwise.iunsetn(flags, 1);
    expect(flags.toNumber()).to.equal(5);
  });
});
