const { expect } = require('chai');
const sut = require('../lib/shortchanid');
// const BN = require('bn.js');

// let b = Buffer.alloc(8);
// b.writeUIntBE(539268, 0, 3);
// b.writeUIntBE(845, 3, 3);
// b.writeUIntBE(1, 6, 2);
// console.log(b.toString('hex'));

// 582766451563888641
// block 530023
// txIdx 1147
// voutIdx 1
// ae99a7038460ac5fad42fa2ace52a1d461a266eb2a23263b98031d39ab7bdeed

// let s = new BN('582766451563888641', 10).toBuffer();
// console.log(sut.shortChannelIdObj(s));

describe('shortChannelIdNumber', () => {
  it('should convert the buffer to a string', () => {
    let input = Buffer.from('083a8400034d0001', 'hex');
    let result = sut.shortChannelIdNumber(input);
    expect(result).to.equal('592931436542885889');
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
