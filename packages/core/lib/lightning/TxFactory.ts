import { Script, TxOut, Value } from "@node-lightning/bitcoin";

export class TxFactory {
    /**
     * Adds a funding output to an existing transaction builder.
     * @param builder
     */
    public static createFundingOutput(
        value: Value,
        localPubKey: Buffer,
        remotePubKey: Buffer,
    ): TxOut {
        const pubkeys = [localPubKey, remotePubKey].sort((a, b) => a.compare(b));
        return new TxOut(value, Script.p2wshLock(Script.p2msLock(2, ...pubkeys)));
    }
}
