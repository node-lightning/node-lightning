const bech32 = require('./bech32');

let input1 =
  'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpuaztrnwngzn3kdzw5hydlzf03qdgm2hdq27cqv3agm2awhz5se903vruatfhq77w3ls4evs3ch9zw97j25emudupq63nyw24cg27h2rspfj9srp';

let input2 =
  'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpquwpc4curk03c9wlrswe78q4eyqc7d8d0xqzpuyk0sg5g70me25alkluzd2x62aysf2pyy8edtjeevuv4p2d5p76r4zkmneet7uvyakky2zr4cusd45tftc9c5fh0nnqpnl2jfll544esqchsrny';

let input3 =
  'lntb20m1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfpp3x9et2e20v6pu37c5d9vax37wxq72un98kmzzhznpurw9sgl2v0nklu2g4d0keph5t7tj9tcqd8rexnd07ux4uv2cjvcqwaxgj7v4uwn5wmypjd5n69z2xm3xgksg28nwht7f6zspwp3f9t';

test('decode should return human readable part', () => {
  let { prefix } = bech32.decode(input1);
  expect(prefix).toBe('lnbc2500u');
});

test('convertWords should include overflow bits in last byte', () => {
  let { words } = bech32.decode(input1);
  words = words.slice(0, 7);
  let result = bech32.convertWords(words, 5, 8, true);
  expect(result).toEqual([11, 37, 254, 100, 64]);
});

test('decode should include overflow bits in last byte', () => {
  let { bytes } = bech32.decode(input1);
  expect(bytes[bytes.length - 1]).toEqual(64);
});

test('encode should be correct for excess word overflow', () => {
  // 970 bitlen, 975 word length, should be truncated
  let { prefix, bytes, bitlen } = bech32.decode(input1);
  let result = bech32.encodeBytes(prefix, bytes, bitlen);
  expect(result).toBe(input1);
});

test('encode should be correct for even word length', () => {
  // 1030 bitlen, 1030 word length, should do nothing
  let { prefix, bytes, bitlen } = bech32.decode(input2);
  let result = bech32.encodeBytes(prefix, bytes, bitlen);
  expect(result).toBe(input2);
});
