// @ts-check

const BN = require('bn.js');
const hrpToPico = require('./hrp-pico');

module.exports = encodePico;

/**
  Encodes pico btc to human readable part amount. The hrp amount is defined
  as the amount of bitcoin as a positive decimal integer with no leading 0s.
  It is an optional number followed by an optional multiplier letter.

  The multipliers are:
  m (milli)   0.001 bitcoin
  u (micro)   0.000001 bitcoin
  n (nano)    0.000000001 bitcoin
  p (pico)    0.000000000001 bitcoin

  This means that 1msat is 10p and 1sat is 10n.

  @param {string} pico
  @return {string}
 */
function encodePico(pico) {
  if (!pico) return;
  let lsdIndex = _lsdIndex(pico);
  let hrpMultiplier = _minimumHrpMultiplier(lsdIndex);
  return new BN(pico).div(hrpToPico(hrpMultiplier)).toString() + hrpMultiplier;
}

///////////////////////////////////////////////////////////////////////////////

/**
  Finds the index of the least significant digit

  For example:
    if the value is 1002 pico, the first digit with a value is 0
    if the value is 1040 pico, the first digit with a value is 1
    if the value is 1000 pico, the first digit with a value is 3

  @return {number} the index the least significant digit
 */
function _lsdIndex(msatStr) {
  for (let i = msatStr.length - 1; i >= 0; i--) {
    if (msatStr[i] != 0) return msatStr.length - i - 1;
  }
  throw new Error('Cannot encode 0');
}

/**
  With the least significant digit we can determine the multiplier
  that is required to miniimze the HRP.

  For instance
    if the value is 1002, we have a value of p
    if the value is 1000, we have a value of n

  @param {number} lsdIndex

  @return {string} returns the string multiplier
 */
function _minimumHrpMultiplier(lsdIndex) {
  if (lsdIndex < 3) return 'p';
  else if (lsdIndex < 6) return 'n';
  else if (lsdIndex < 9) return 'u';
  else if (lsdIndex < 12) return 'm';
  else return '';
}
