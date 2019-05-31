// @ts-check

const OPS = require('bitcoin-ops');
const { compileScript } = require('./compile-script');

module.exports = { p2shScript };

/**
  Creates a standard Pay to Script Hash script by accepting a
  hash of a script as input and generating the P2SH script:
    OP_HASH160 <hashScript> OP_EQUAL

  @remarks
  Inspired by bitcoinjs-lib
  https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2pkh.js#L58

  @param {Buffer} hash160Script hash160 of script buffer
  @returns {Buffer} converted script
 */
function p2shScript(hash160Script) {
  // prettier-ignore
  return compileScript([
    OPS.OP_HASH160,
    hash160Script,
    OPS.OP_EQUAL
  ]);
}
