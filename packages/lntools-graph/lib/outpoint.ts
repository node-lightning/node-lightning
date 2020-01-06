import { outpointToString } from "./output-to-string";

export class OutPoint {
  /**
   * Transaction ID
   */
  public txId: string;

  /**
   * Index of output in transaction
   */
  public voutIdx: number;

  constructor(txId: string, voutIdx: number) {
    this.txId = txId;
    this.voutIdx = voutIdx;
  }

  /**
   * Converts the outpoint to a human readable string
   * where in the format [txid]:[voutidx]
   */
  public toString() {
    return outpointToString(this);
  }
}
