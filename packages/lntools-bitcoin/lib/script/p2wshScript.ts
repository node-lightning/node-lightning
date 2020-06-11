// tslint:disable-next-line: no-var-requires
import { compileScript } from "./compile-script";
import { OpCode } from "./OpCodes";

/**
 * Create a p2wshScript
 */
export function p2wshScript(sha256Script: Buffer): Buffer {
  return compileScript([
    OpCode.OP_0,
    sha256Script,
  ]); // prettier-ignore
}
