const bech32 = require('bech32');

module.exports = {
  decode,
  convertWords,
};

function decode(invoice) {
  let { prefix, words } = bech32.decode(invoice, 1023);
  let bytes = convertWords(words, 5, 8);
  return {
    prefix,
    words,
    bytes,
  };
}

function convertWords(data, inBits, outBits) {
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

  if (bits > 0) {
    result.push((value << (outBits - bits)) & maxV);
  }

  return result;
}
