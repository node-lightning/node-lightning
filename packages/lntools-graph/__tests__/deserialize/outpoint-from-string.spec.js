const { expect } = require('chai');
const { outpointFromString } = require('../../lib/deserialize/outpoint-from-string');
const { OutPoint } = require('../../lib/outpoint');

describe('.outpointFromString', () => {
  it('should construct an OutPoint', () => {
    let input = 'dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd:0';
    let result = outpointFromString(input);
    expect(result).to.be.instanceOf(OutPoint);
  });

  it('should have a string txId', () => {
    let input = 'dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd:0';
    let result = outpointFromString(input);
    expect(result.txId).to.equal(
      'dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd'
    );
  });

  it('should have a number voutIdx', () => {
    let input = 'dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd:0';
    let result = outpointFromString(input);
    expect(result.voutIdx).to.equal(0);
  });

  it('should throw when invlid txId length', () => {
    let input = 'aa:0';
    expect(() => outpointFromString(input)).to.throw();
  });

  it('should throw when invalid voutIdx', () => {
    let input = 'dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd:a';
    expect(() => outpointFromString(input)).to.throw();
  });

  it('should throw when out of range voutIdx', () => {
    let input = 'dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd:-1';
    expect(() => outpointFromString(input)).to.throw();
  });
});
