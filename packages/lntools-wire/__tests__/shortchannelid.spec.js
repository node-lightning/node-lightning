const { expect } = require('chai');
const sut = require('../lib/shortchanid');

describe('shortChannelIdBuffer', () => {
  it('should conver the object to a buffer', () => {
    let input = { block: 1288457, txIdx: 3, voutIdx: 0 };
    let expected = Buffer.from('13a9090000030000', 'hex');
    let result = sut.shortChannelIdBuffer(input);
    expect(result).to.deep.equal(expected);
  });
});

describe('shortChannelIdNumber', () => {
  it('should convert the buffer to a string', () => {
    let input = Buffer.from('13a9090000030000', 'hex');
    let result = sut.shortChannelIdNumber(input);
    expect(result).to.equal('1416673453389578240');
  });
});

describe('shortChannelIdString', () => {
  it('should convert the buffer to a human readable string', () => {
    let input = Buffer.from('083a8400034d0001', 'hex');
    let result = sut.shortChannelIdString(input);
    expect(result).to.equal('539268x845x1');
  });
});

describe('shortChannelIdObj', () => {
  it('should convert the buffer to an object with parts', () => {
    let input = Buffer.from('083a8400034d0001', 'hex');
    let result = sut.shortChannelIdObj(input);
    expect(result).to.deep.equal({
      block: 539268,
      txIdx: 845,
      voutIdx: 1,
    });
  });
});
