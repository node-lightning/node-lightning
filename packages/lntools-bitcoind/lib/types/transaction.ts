export interface Transaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: Array<Input>;
  vout: Array<Output>;
  hex: string;
  blockhash: string;
  confirmations: number;
  time: number;
  blocktime: number;
}

export interface Input {
  txid: string;
  vout: number;
  scriptSig: ScriptSig;
  sequence: number;
}

export interface Output {
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
}

export interface ScriptSig {
  asm: string;
  hex: string;
}

export interface ScriptPubKey {
  asm: string;
  hex: string;
  type: string;
  reqSigs?: number;
  addresses?: Array<string>;
}
