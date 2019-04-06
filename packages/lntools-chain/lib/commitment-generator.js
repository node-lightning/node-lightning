const { sha256 } = require('@lntools/crypto');
const BN = require('bn.js');

module.exports = {
  generateFromSeed,
};

// note we will need to use bignumber.js because we can't do bitmath over 2**32
function generateFromSeed(seed, i) {
  i = new BN(i);
  let p = seed;
  for (let b = 47; b >= 0; b--) {
    if (i.and(new BN(2 ** b)).gtn(0)) {
      // since p is a buffer...
      //  read least significant int64 value
      //  flip via int64 ^ 2**b
      //  write back to buffer at least significant portion

      // alternative, can calculate the byte index and flip appropriate bit inside appropriate byte
      let byteIndex = Math.floor(b / 8);
      let bitIndex = b % 8;

      // flip the specified bit in the specific byte
      p[byteIndex] = p[byteIndex] ^ (2 ** bitIndex);

      // console.log(`flipping ${b} on byte ${byteIndex} bit ${bitIndex}`);

      p = sha256(p);
    }
  }
  return p;
}
