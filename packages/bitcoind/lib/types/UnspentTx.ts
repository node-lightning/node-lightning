export type UnspentTx = {
    txid: string;
    vout: number;
    address: string;
    label: string;
    scriptPubKey: string;
    amount: number;
    confirmations: number;
    redeemScript: string;
    witnessScript: string;
    spendable: boolean;
    solvable: boolean;
    reused: boolean;
    desc: string;
    safe: boolean;
};
