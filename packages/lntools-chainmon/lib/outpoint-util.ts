import { Outpoint } from "./outpoint";

/**
 * Generates a key from an outpoint
 * @param outpoint
 */
export function outpointKey(outpoint: Outpoint): string {
  return `${outpoint.txId.toString("hex")}:${outpoint.output}`;
}
