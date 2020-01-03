// tslint:disable-next-line: no-var-requires
const OPS = require("bitcoin-ops");
import { compileScript } from "./compile-script";

/**
 * Creates a standard Pay to Public Key Hash script by accepting a
 * hash of a public key as input and generating the script in the standand
 * P2PKH script format:
 *   OP_DUP OP_HASH160 <hash160pubkey> OP_EQUALVERIFY OP_CHECKSIG
 *
 * @remarks
 * Inspired by bitcoinjs-lib
 * https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/payments/p2pkh.js#L58
 */
export function p2pkhScript(hash160PubKey: Buffer): Buffer {
  // TODO: validate buffer
  return compileScript([
    OPS.OP_DUP,
    OPS.OP_HASH160,
    hash160PubKey,
    OPS.OP_EQUALVERIFY,
    OPS.OP_CHECKSIG,
  ]); // prettier-ignore
}
