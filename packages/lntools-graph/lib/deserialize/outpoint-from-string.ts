import { OutPoint } from "../outpoint";

/**
 * Converts a string in the format [txid]:[voutidx] into
 * an OutPoint object
 */
export function outpointFromString(text: string): OutPoint {
  const parts = text.match(/([0-9a-f]{64,64}):(\d+)/i);
  if (!parts) {
    throw new Error("invalid argument");
  }
  const txId = parts[1];
  const voutIdx = parseInt(parts[2]);
  if (voutIdx < 0) {
    throw new Error("invalid argument");
  }
  return new OutPoint(txId, voutIdx);
}
