const bech32 = require('bech32');

module.exports = {
  decode,
  encodeBytes,
  convertWords,
};

function decode(invoice) {
  let { prefix, words } = bech32.decode(invoice, 1023);
  let bytes = convertWords(words, 5, 8, true);
  return {
    prefix,
    words,
    bytes,
    bitlen: words.length * 5,
  };
}

function encodeBytes(prefix, bytes, bitlen) {
  let words = convertWords(bytes, 8, 5);
  //console.log(bytes.length * 8, bitlen, words.length * 5);
  if (words.length * 5 > bitlen) words.pop();
  return bech32.encode(prefix, words, 1023);
}

function convertWords(data, inBits, outBits, pad) {
  var value = 0;
  var bits = 0;
  var maxV = (1 << outBits) - 1;

  var result = [];
  for (var i = 0; i < data.length; ++i) {
    value = (value << inBits) | data[i];
    bits += inBits;

    while (bits >= outBits) {
      bits -= outBits;
      result.push((value >> bits) & maxV);
    }
  }

  if (pad && bits > 0) {
    result.push((value << (outBits - bits)) & maxV);
  }

  return result;
}
