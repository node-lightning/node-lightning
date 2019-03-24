module.exports = {
  convertWords,
  sizeofNum,
  sizeofBits,
  sizeofBytes,
};

/**
  Converts a Buffer into a a word array and optionally pads bits.
  This function is needed because the default bech32 fromWords/toWords
  functions do not allow us to optionally include/exclude padding.
  The encoder needs to pad bits.  The decoder does not care about the
  padding bits.

  @param {Buffer} data
  @param {number} inBits
  @param {number} outBits
  @param {boolean} pad
  @return {Array[number]} converted words
 */
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

/**
  Calculates the number of words needed to store the number.
  In bech32, each word is 5 bits (2^5 = 32). To properly
  encode a number, we need to determine how many words
  are necessary to encode the value.

  @param {number} num
 */
function sizeofNum(num) {
  return Math.ceil(Math.log2(num) / 5);
}

/**
  Calculates the number of words needed to store
  the supplied number of bits. In bech32, each words is 5 bits
  (2^5 = 32).

  @param {number} bits
 */
function sizeofBits(bits) {
  return Math.ceil(bits / 5);
}

/**
  Calculates the number of words needeed to store
  the supplied number of bytes. In bech32, each words is 5 bits
  (2^5 = 32). We first convert the bytes to bits and then
  convert to words.

  @param {number} bytes
 */
function sizeofBytes(bytes) {
  return sizeofBits(bytes * 8);
}
