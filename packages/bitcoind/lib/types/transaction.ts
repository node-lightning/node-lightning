export type Transaction = {
    txid: string;
    hash: string;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    locktime: number;
    vin: Input[];
    vout: Output[];
    hex: string;
    blockhash: string;
    confirmations: number;
    time: number;
    blocktime: number;
};

export type Input = {
    txid: string;
    vout: number;
    scriptSig: ScriptSig;
    sequence: number;
};

export type Output = {
    value: number;
    n: number;
    scriptPubKey: ScriptPubKey;
};

export type ScriptSig = {
    asm: string;
    hex: string;
};

export type ScriptPubKey = {
    asm: string;
    hex: string;
    type: string;
    reqSigs?: number;
    addresses?: string[];
};

export type Utxo = {
    bestblock: string;
    confirmations: string;
    value: number;
    scriptPubKey: ScriptPubKey;
    coinbase: boolean;
};
