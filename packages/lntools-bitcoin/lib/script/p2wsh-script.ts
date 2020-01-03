// tslint:disable-next-line: no-var-requires
const OPS = require("bitcoin-ops");
import { compileScript } from "./compile-script";

/**
 * Create a p2wshScript
 */
export function p2wshScript(hash160Script: Buffer): Buffer {
  return compileScript([
    OPS.OP_0,
    hash160Script,
  ]); // prettier-ignore
}
