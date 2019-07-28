const { expect } = require('chai');
const { ShortChannelId } = require('../lib/shortchanid');
const sut = require('../lib/shortchanid');

describe('ShortChannelId', () => {
  describe('.toString', () => {
    it('should return a human readable string', () => {
      let input = new ShortChannelId(1288457, 3, 0);
      let actual = input.toString();
      expect(actual).to.equal('1288457x3x0');
    });
  });

  describe('.toBuffer', () => {
    it('should return a buffer with block as MSBs and voutIdx as LSBs', () => {
      let input = new ShortChannelId(1288457, 3, 0);
      let actual = input.toBuffer();
      expect(actual.toString('hex')).to.deep.equal('13a9090000030000');
    });
  });

  describe('.toNumber', () => {
    it('should return a BN value representation of the buffer', () => {
      let input = new ShortChannelId(1288457, 3, 0);
      let actual = input.toNumber();
      expect(actual.toString(10)).to.equal('1416673453389578240');
    });
  });
});

describe('shortChannelIdToBuffer', () => {
  it('should convert the object to a buffer', () => {
    let input = new ShortChannelId(1288457, 3, 0);
    let expected = Buffer.from('13a9090000030000', 'hex');
    let result = sut.shortChannelIdToBuffer(input);
    expect(result).to.deep.equal(expected);
  });
});

describe('shortChannelIdToNumber', () => {
  it('should convert the object to a human readable string', () => {
    let input = new ShortChannelId(1288457, 3, 0);
    let result = sut.shortChannelIdToNumber(input);
    expect(result.toString(10)).to.equal('1416673453389578240');
  });
});

describe('shortChannelIdToString', () => {
  it('should convert the buffer to a human readable string', () => {
    let input = new ShortChannelId(539268, 845, 1);
    let result = sut.shortChannelIdToString(input);
    expect(result).to.equal('539268x845x1');
  });
});

describe('shortChannelIdFromString', () => {
  it('should return the object', () => {
    let input = '539268x845x1';
    let result = sut.shortChannelIdFromString(input);
    expect(result).to.deep.equal(new ShortChannelId(539268, 845, 1));
  });

  it('should throw when not a pattern match', () => {
    let input = '1ax2bx3c';
    expect(() => sut.shortChannelIdFromString(input)).to.throw();
  });
});

describe('shortChannelIdFromBuffer', () => {
  it('should convert a buffer to an object with parts', () => {
    let input = Buffer.from('083a8400034d0001', 'hex');
    let result = sut.shortChannelIdFromBuffer(input);
    expect(result).to.deep.equal(new ShortChannelId(539268, 845, 1));
  });

  it('should throw when not a buffer', () => {
    let input = 'abc';
    expect(() => sut.shortChannelIdFromBuffer(input)).to.throw();
  });

  it('should throw when incorrect length buffer', () => {
    let input = Buffer.from('083a8400034d', 'hex');
    expect(() => sut.shortChannelIdFromBuffer(input)).to.throw();
  });
});
