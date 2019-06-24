// @ts-check

// @ts-ignore
const OPS = require('bitcoin-ops');
const { compileScript } = require('./compile-script');

module.exports = { p2wshScript };

/**
  Create a p2wshScript
 */
function p2wshScript(hash160Script) {
  return compileScript([
    OPS.OP_0,
    hash160Script,
  ]); // prettier-ignore
}
