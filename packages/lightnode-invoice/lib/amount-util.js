const BN = require('bn.js');

module.exports = {
  charToMsatMultiplier,
};

let units = {
  m: new BN(1e8),
  u: new BN(1e5),
  n: new BN(1e2),
  p: new BN(1),
};

/**
 * Converts an amount character into a
 * multiplier that will be used
 * to convert from bitcoin into millisat
 * @param {string} char
 * @return {BN} returns a BN.js number
 */
function charToMsatMultiplier(char) {
  if (char === undefined) return new BN(1e11);
  if (units[char]) return units[char];
  throw new Error('Invalid multiplier');
}
