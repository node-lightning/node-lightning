import { OutPoint } from "./outpoint";

/**
 * Converts an outpoint to a readable string
 */
export function outpointToString(o: OutPoint): string {
  return `${o.txId}:${o.voutIdx}`;
}
