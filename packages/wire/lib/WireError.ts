export enum WireErrorCode {
    nodeAnnSigFailed = 1,
    chanAnnSigFailed = 2,
    chanUpdSigFailed = 3,
    chanBadBlockHash = 4,
    chanBadBlock = 5,
    chanAnnBadTx = 6,
    chanUtxoSpent = 7,
    chanBadScript = 8,
    gossipManagerNotStarted = 101,
}

const errorCodeStrings = {
    1: "node_ann_sig_failed",
    2: "chan_ann_sig_failed",
    3: "chan_upd_sig_failed",
    4: "chan_bad_block_hash",
    5: "chan_bad_block",
    6: "chan_bad_tx",
    7: "chan_utxo_spent",
    8: "chan_bad_script",
    101: "gossip_manager_not_started",
};

/**
 * Creates an error for a wire operation and captures relevant that
 * caused the error to be emitted or thrown.
 */
export class WireError extends Error {
    public area: string;
    public code: WireErrorCode;
    public data: any;

    constructor(code: WireErrorCode, data?: any) {
        const msg = `${errorCodeStrings[code]}`;
        super(msg);

        this.area = "wire";
        this.code = code;
        this.data = data;
    }
}
