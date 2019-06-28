let { expect } = require('chai');
let { ipv4StringFromBuffer } = require('../../../lib/deserialize/address/ipv4-string-from-buffer');

let tests = [
  [
    'localhost',
    Buffer.from([127,0,0,1]),
    '127.0.0.1',
  ],
  [
    'standard address',
    Buffer.from([38, 87, 54, 163]),
    '38.87.54.163',
  ],
  [
    'max address',
    Buffer.from('ffffffff', 'hex'),
    '255.255.255.255',
  ],
]; // prettier-ignore

describe('ipv4StringFromBuffer', () => {
  for (let [title, input, expected] of tests) {
    it(title, () => {
      let actual = ipv4StringFromBuffer(input);
      expect(actual).to.equal(expected);
    });
  }
});
