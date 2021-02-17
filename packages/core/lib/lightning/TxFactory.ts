import {
    bip69InputSorter,
    bip69OutputSorter,
    OutPoint,
    Script,
    TxBuilder,
    TxOut,
    Value,
} from "@node-lightning/bitcoin";
import { CommitmentNumber } from "./CommitmentNumber";
import { ScriptFactory } from "./ScriptFactory";

export class TxFactory {
    /**
     * Creates a TxOut to attach to a funding transaction. This includes
     * the P2WSH-P2MS script that uses 2-2MS. The open and accept funding
     * pubkeys are sorted lexicographcially to create the script.
     * @param builder
     */
    public static createFundingOutput(
        value: Value,
        openPubKey: Buffer,
        acceptPubKey: Buffer,
    ): TxOut {
        const script = Script.p2wshLock(ScriptFactory.fundingScript(openPubKey, acceptPubKey));
        return new TxOut(value, script);
    }

    /**
     * Constructs a commitment transaction
     * @param commitmentNumber
     * @param openPaymentBasePoint
     * @param acceptPaymentBasePoint
     * @param fundingTx
     * @param dustLimitSatoshi
     * @param feeWeightPerKw
     * @param isFunderLocal
     * @param localValue
     * @param remoteValue
     * @param revocationPubKey
     * @param delayedPubKey
     * @param toSelfDelay
     * @param remotePubKey
     */
    public static createCommitment(
        commitmentNumber: number,
        openPaymentBasePoint: Buffer,
        acceptPaymentBasePoint: Buffer,
        fundingTx: OutPoint,
        dustLimitSatoshi: Value,
        feeWeightPerKw: bigint,
        isFunderLocal: boolean,
        localValue: Value,
        remoteValue: Value,
        revocationPubKey: Buffer,
        delayedPubKey: Buffer,
        toSelfDelay: number,
        remotePubKey: Buffer,
    ): TxBuilder {
        const obscuredCommitmentNumber = CommitmentNumber.obscure(
            commitmentNumber,
            openPaymentBasePoint,
            acceptPaymentBasePoint,
        );

        // 1. add the input as the funding outpoint and set the nSequence
        const tx = new TxBuilder(bip69InputSorter, bip69OutputSorter);
        tx.version = 2;
        tx.addInput(fundingTx, CommitmentNumber.getSequence(obscuredCommitmentNumber));

        // 2. set the locktime to the obscurred commitment number
        tx.locktime = CommitmentNumber.getLockTime(obscuredCommitmentNumber);

        // 3. find unpruned outputs
        const unprunedHtlcs = [];

        // 4. calculate base fee
        const weight = 724 + unprunedHtlcs.length * 172;
        const baseFee = (BigInt(weight) * feeWeightPerKw) / 1000n;

        // 5. substract base fee from funding node
        if (isFunderLocal) {
            const newValue = localValue.sats - baseFee;
            if (newValue > 0n) {
                localValue = Value.fromSats(newValue);
            } else {
                localValue = Value.zero();
            }
        } else {
            const newValue = remoteValue.sats - baseFee;
            if (newValue > 0n) {
                remoteValue = Value.fromSats(newValue);
            } else {
                remoteValue = Value.zero();
            }
        }

        // 6/7. add unpruned offered/received HTLCs

        // 8. add local if unpruned
        if (localValue.sats >= dustLimitSatoshi.sats) {
            tx.addOutput(
                localValue,
                Script.p2wshLock(ScriptFactory.toLocalScript(revocationPubKey, delayedPubKey, toSelfDelay)), // prettier-ignore
            );
        }

        // 9. add remote if unpruned
        if (remoteValue.sats >= dustLimitSatoshi.sats) {
            tx.addOutput(remoteValue, Script.p2wpkhLock(remotePubKey));
        }

        return tx;
    }
}
