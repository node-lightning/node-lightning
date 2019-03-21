const BN = require('bn.js');
const { charToMsatMultiplier } = require('./amount-util');

module.exports = encodeMsat;

/**
  Encodes millisats to human readable part amount. The hrp amount is defined
  as the amount of bitcoin as a positive decimal integer with no leading 0s.
  It is an optional number followed by an optional multiplier letter.

  The multipliers are:
  m (milli)   0.001 bitcoin
  u (micro)   0.000001 bitcoin
  n (nano)    0.000000001 bitcoin
  p (pico)    0.000000000001 bitcoin

  This means that 1msat is 10p when encoded since p multiplies bitcoin by
  0.000000000001.

  @param {string} msat
  @return {string}
 */
function encodeMsat(msat) {
  if (!msat) return;
  let lsdIndex = _lsdIndex(msat);
  let multiplier = _multiplierFromLsdIndex(lsdIndex);
  let multiplierValue = charToMsatMultiplier(multiplier);

  if (!multiplier) {
    return new BN(msat).div(multiplierValue).toString();
  } else if (multiplier === 'p') {
    return new BN(msat).muln(10).toString() + multiplier;
  } else {
    return new BN(msat).div(multiplierValue).toString() + multiplier;
  }
}

/**
  Finds the index of the least significant digit.

  For example:
    if the value is 1002 msat, the first digit with a value is 0
    if the value is 1040 msat, the first digit with a value is 1
    if the value is 1000 msat, the first digit with a value is 3

  @return {number} the index the least significant digit
 */
function _lsdIndex(msatStr) {
  for (let i = msatStr.length - 1; i >= 0; i--) {
    if (msatStr[i] != 0) return msatStr.length - i;
  }
  throw new Error('Cannot encode 0');
}

/**
  With the least significant digit we can determine the multiplier
  that we need to use to ensure the encoded result is an integer.

  For instance if we have a lsd of < 3 we are have values inside
  the pico btc range. Consider 1002 msat, which is 0.00000001002 btc
  we need to conver this to pico btc to capture the 1002 appropriately.

  @param {number} lsdIndex

  @return {string} returns the string multiplier
 */
function _multiplierFromLsdIndex(lsdIndex) {
  if (lsdIndex < 3) return 'p';
  else if (lsdIndex < 6) return 'n';
  else if (lsdIndex < 9) return 'u';
  else if (lsdIndex < 12) return 'm';
  else return undefined;
}
