// tslint:disable-next-line: no-var-requires
const OPS = require("bitcoin-ops");
import { compileScript } from "./compile-script";

/**
 * Creates a standard Pay to Script Hash script by accepting a
 * hash of a script as input and generating the P2SH script:
 *   OP_HASH160 <hashScript> OP_EQUAL
 *
 * @remarks
 * Inspired by bitcoinjs-lib
 * https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2pkh.js#L58
 */
export function p2shScript(hash160Script: Buffer): Buffer {
  // TODO: validate buffer
  // prettier-ignore
  return compileScript([
    OPS.OP_HASH160,
    hash160Script,
    OPS.OP_EQUAL,
  ]);
}
