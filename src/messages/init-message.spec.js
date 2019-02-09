const { expect } = require('chai');
const BN = require('bn.js');
let InitMessage = require('./init-message');

describe('init-message', () => {
  let remote = '0010000102000182';

  it('it should have correct default values', () => {
    let obj = new InitMessage();
    expect(obj.type).to.equal(16);
    expect(obj.globalFeatures.toNumber()).to.equal(0);
    expect(obj.localFeatures.toNumber()).to.equal(0);
  });

  it('it should deserialize type', () => {
    let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
    expect(result.type).to.equal(16);
  });

  it('it should deserialize globalFeatures', () => {
    let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
    expect(result.globalFeatures.toNumber()).to.equal(0x2);
  });

  it('it should deserialize localFeatures', () => {
    let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
    expect(result.localFeatures.toNumber()).to.equal(0x82);
  });

  // todo - add safe readBuffer methods to simple-buffer-cursor to prevent overflows
  it('should not throw exception on length overflows');

  it('it should serialize type', () => {
    let obj = new InitMessage();
    let result = obj.serialize();
    expect(result.toString('hex')).to.equal('001000000000');
  });

  it('it should serialize globalFeatures', () => {
    let obj = new InitMessage();
    obj.globalFeatures = new BN(2);
    let result = obj.serialize();
    expect(result.toString('hex')).to.equal('00100001020000');
  });

  it('it should serialize localFeatures', () => {
    let obj = new InitMessage();
    obj.localFeatures = new BN(8);
    let result = obj.serialize();
    expect(result.toString('hex')).to.equal('00100000000108');
  });
});
