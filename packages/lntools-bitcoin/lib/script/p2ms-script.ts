// tslint:disable-next-line: no-var-requires
const OPS = require("bitcoin-ops");
import { compileScript } from "./compile-script";

/**
 * Creates a standard Pay to MultiSig script by accepting a
 * m of n public keys as inputs in the format:
 *   OP_<m> <pubkey1> <pubkey2> <pubkey..m> OP_<n> OP_CHECKMULTISIG
 *
 * @remarks
 * Inspired by bitcoinjs-lib
 * https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2ms.js#L58
 */
export function p2msScript(m: number, n: number, pubkeys: Buffer[]): Buffer {
  return compileScript([
    80 + m,
    ...pubkeys,
    80 + n,
    OPS.OP_CHECKMULTISIG,
  ]); // prettier-ignore
}
