const { expect } = require('chai');
const BN = require('bn.js');
let InitMessage = require('../lib/init-message');

describe('InitMessage', () => {
  it('should have correct default values', () => {
    let obj = new InitMessage();
    expect(obj.type).to.equal(16);
    expect(obj.globalFeatures.toNumber()).to.equal(0);
    expect(obj.localFeatures.toNumber()).to.equal(0);
  });

  it('should set localDataLossProtect', () => {
    let obj = new InitMessage();
    obj.localDataLossProtect = true;
    expect(obj.localDataLossProtect).to.be.true;
    expect(obj.localFeatures.toNumber()).to.equal(2);
  });

  it('should unset localDataLossProtect', () => {
    let obj = new InitMessage();
    obj.setLocalBit(0);
    obj.setLocalBit(1);
    obj.localDataLossProtect = false;
    expect(obj.localFeatures.toNumber()).to.equal(0);
  });

  it('should set localInitialRoutingSync', () => {
    let obj = new InitMessage();
    obj.localInitialRoutingSync = true;
    expect(obj.localInitialRoutingSync).to.be.true;
    expect(obj.localFeatures.toNumber()).to.equal(8);
  });

  it('should unset localInitialRoutingSync', () => {
    let obj = new InitMessage();
    obj.setLocalBit(3);
    obj.localInitialRoutingSync = false;
    expect(obj.localFeatures.toNumber()).to.equal(0);
  });

  it('should set localUpfrontShutdownScript', () => {
    let obj = new InitMessage();
    obj.localUpfrontShutdownScript = true;
    expect(obj.localUpfrontShutdownScript).to.be.true;
    expect(obj.localFeatures.toNumber()).to.equal(32);
  });

  it('should unset localUpfrontShutdownScript', () => {
    let obj = new InitMessage();
    obj.setLocalBit(4);
    obj.setLocalBit(5);
    obj.localUpfrontShutdownScript = false;
    expect(obj.localFeatures.toNumber()).to.equal(0);
  });

  it('should set localGossipQueries', () => {
    let obj = new InitMessage();
    obj.localGossipQueries = true;
    expect(obj.localGossipQueries).to.be.true;
    expect(obj.localFeatures.toNumber()).to.equal(128);
  });

  it('should unset localGossipQueries', () => {
    let obj = new InitMessage();
    obj.setLocalBit(6);
    obj.setLocalBit(7);
    obj.localGossipQueries = false;
    expect(obj.localGossipQueries.toNumber()).to.equal(0);
  });

  describe('.serialize', () => {
    it('should serialize type', () => {
      let obj = new InitMessage();
      let result = obj.serialize();
      expect(result.toString('hex')).to.equal('001000000000');
    });

    it('should serialize globalFeatures', () => {
      let obj = new InitMessage();
      obj.globalFeatures = new BN(1);
      let result = obj.serialize();
      expect(result.toString('hex')).to.equal('00100001010000');
    });

    it('should serialize localFeatures', () => {
      let obj = new InitMessage();
      obj.localFeatures = new BN(8);
      let result = obj.serialize();
      expect(result.toString('hex')).to.equal('00100000000108');
    });
  });

  describe('.deserialize', () => {
    let remote = '0010000102000182';

    it('should deserialize type', () => {
      let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
      expect(result.type).to.equal(16);
    });

    it('should deserialize globalFeatures', () => {
      let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
      expect(result.globalFeatures.toNumber()).to.equal(0x2);
    });

    it('should deserialize localFeatures', () => {
      let result = InitMessage.deserialize(Buffer.from(remote, 'hex'));
      expect(result.localFeatures.toNumber()).to.equal(0x82);
    });
  });
});
