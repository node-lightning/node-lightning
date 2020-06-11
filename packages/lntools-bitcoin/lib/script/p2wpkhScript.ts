// tslint:disable-next-line: no-var-requires
import { compileScript } from "./compile-script";
import { OpCode } from "./OpCodes";

/**
 * Create a p2wpkh locking script
 */
export function p2wpkScript(hash160Script: Buffer): Buffer {
  return compileScript([
    OpCode.OP_0,
    hash160Script,
  ]); // prettier-ignore
}
