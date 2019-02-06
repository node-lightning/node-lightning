const { expect } = require('chai');
let InitMessage = require('./init-message');

describe('init-message', () => {
  let remote =
    '00F000360a800c27f83bebc66efa1f580554c65bed3da1b6352d2f5dbb702e90ac20bb1d34dc0bdd444163ca18468d568dbeeda2c865909bf129498680f792c197e923fd';

  it('it should have correct default values', () => {
    let obj = new InitMessage();
    expect(obj.type).to.equal(16);
    expect(obj.globalFeatures).to.equal(0);
    expect(obj.localFeatures).to.equal(0);
  });

  it('it should deserialize type', () => {
    let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
    expect(result.type).to.equal(16);
  });

  it('it should deserialize globalFeatures', () => {
    let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
    expect(result.globalFeatures).to.equal(54);
  });

  it('it should deserialize localFeatures', () => {
    let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
    expect(result.localFeatures).to.equal(2688);
  });

  it('it should serialize type', () => {
    let obj = new InitMessage();
    let result = obj.serialize();
    expect(result.toString('hex')).to.equal('001000000000');
  });

  it('it should serialize globalFeatures', () => {
    let obj = new InitMessage();
    obj.globalFeatures = 2;
    let result = obj.serialize();
    expect(result.toString('hex')).to.equal('001000020000');
  });

  it('it should serialize localFeatures', () => {
    let obj = new InitMessage();
    obj.localFeatures = 4;
    let result = obj.serialize();
    expect(result.toString('hex')).to.equal('001000000004');
  });
});
