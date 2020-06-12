export class OutPoint {
    /**
     * Creates an OutPoint instance from an Outpoint serialized
     * to the standard string of "<txid>:<vout>"
     */
    public static fromString(text: string) {
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
        return `${this.txId}:${this.voutIdx}`;
    }
}
