export type Tx = {
    txId: Buffer;
    hash: Buffer;
    version: number;
    size: number;
    vsize: number;
    weight: number;
    vin: TxIn[];
    vout: TxOut[];
    locktime: number;
};

export type TxIn = {
    txId: Buffer;
    vout: number;
    scriptSig?: Buffer;
    witness?: Buffer[];
    sequence: number;
};

export type TxOut = {
    value: bigint;
    pubKeyScript: Buffer;
};
