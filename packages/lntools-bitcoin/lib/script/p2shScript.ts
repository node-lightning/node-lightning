// tslint:disable-next-line: no-var-requires
import { compileScript } from "./compile-script";
import { OpCode } from "./OpCodes";

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
    OpCode.OP_HASH160,
    hash160Script,
    OpCode.OP_EQUAL,
  ]);
}
