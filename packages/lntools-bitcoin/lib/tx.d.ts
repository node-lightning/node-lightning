import BN = require('bn.js');

export interface Tx {
  txId: Buffer;
  hash: Buffer;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  vin: Array<TxIn>;
  vout: Array<TxOut>;
  locktime: number;
}

export interface TxIn {
  txId: Buffer;
  hash: Buffer;
  vout: number;
  scriptSig?: Buffer;
  witness?: Array<Buffer>;
  sequence: number;
}

export interface TxOut {
  value: BN;
  pubKeyScript: Buffer;
}
