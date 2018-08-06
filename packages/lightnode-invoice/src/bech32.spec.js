const bech32 = require('./bech32');

let input1 =
  'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2hdq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2rspfj9srp';

test('decode should return human readable part', () => {
  let { prefix } = bech32.decode(input1);
  expect(prefix).toBe('lnbc2500u');
});

test('convertWords should include overflow bits in last byte', () => {
  let { words } = bech32.decode(input1);
  words = words.slice(0, 7);
  let result = bech32.convertWords(words, 5, 8);
  expect(result).toEqual([11, 37, 254, 100, 64]);
});

test('decode should include overflow bits in last byte', () => {
  let { bytes } = bech32.decode(input1);
  expect(bytes[bytes.length - 1]).toEqual(64);
});
