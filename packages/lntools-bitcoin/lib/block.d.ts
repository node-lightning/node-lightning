import { Tx } from './tx';

export interface Block {
  hash: string;
  strippedsize: number;
  size: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkelroot: string;
  time: number;
  mediantime: number;
  chainwork: string;
  previousblockhash: string;
  nextblockhash: string;
  bits: string;
  difficulty: string;
  txs: Array<Tx>;
}
