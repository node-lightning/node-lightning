// @ts-check

const BN = require('bn.js');

module.exports = hrpToPico;

/**
  Returns the pico equivalent of the hrp multiplier as a BN object

  For instance:
    since m (milli) is 0.001 bitcoin, this is the equivalent of
    1000000000 or 1e9 pico bitcoin.

  @param {string} hrpMultiplier
  @return {BN} returns the BN pico bitcoin value
 */
function hrpToPico(hrpMultiplier) {
  if (!hrpMultiplier) return new BN(1e12);
  switch (hrpMultiplier) {
    case 'm':
      return new BN(1e9);
    case 'u':
      return new BN(1e6);
    case 'n':
      return new BN(1e3);
    case 'p':
      return new BN(1);
    default:
      throw new Error('Invalid multiplier');
  }
}
