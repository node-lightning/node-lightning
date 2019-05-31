// @ts-check

const OPS = require('bitcoin-ops');
const { compileScript } = require('./compile-script');

module.exports = { p2msScript };

/**
  Creates a standard Pay to MultiSig script by accepting a
  m of n public keys as inputs in the format:
    OP_<m> <pubkey1> <pubkey2> <pubkey..m> OP_<n> OP_CHECKMULTISIG

  @remarks
  Inspired by bitcoinjs-lib
  https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2ms.js#L58

  @param {Number} m
  @param {Number} n
  @param {Array<Buffer>} pubkeys
  @returns {Buffer} converted script
 */
function p2msScript(m, n, pubkeys) {
  return compileScript([
    80 + m,
    ...pubkeys,
    80 + n,
    OPS.OP_CHECKMULTISIG,
  ]); // prettier-ignore
}
