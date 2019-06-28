let { expect } = require('chai');
let { ipv4StringToBuffer } = require('../../../lib/serialize/address/ipv4-string-to-buffer');

let tests = [
  [
    'localhost',
    '127.0.0.1',
    Buffer.from([127,0,0,1]),
  ],
  [
    'standard address',
    '38.87.54.163',
    Buffer.from([38, 87, 54, 163]),
  ],
  [
    'max address',
    '255.255.255.255',
    Buffer.from('ffffffff', 'hex'),
  ],
]; // prettier-ignore

describe('ipv4StringFromBuffer', () => {
  for (let [title, input, expected] of tests) {
    it(title, () => {
      let actual = ipv4StringToBuffer(input);
      expect(actual).to.deep.equal(expected);
    });
  }
});
