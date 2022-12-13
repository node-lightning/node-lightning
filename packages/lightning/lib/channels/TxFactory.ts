import {
    HashValue,
    LockTime,
    OutPoint,
    Script,
    Sequence,
    TxBuilder,
    TxOut,
    Value,
} from "@node-lightning/bitcoin";
import { CommitmentNumber } from "./CommitmentNumber";
import { Htlc } from "../domain/Htlc";
import { HtlcDirection } from "../domain/HtlcDirection";
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
     * Constructs an unsigned commitment transaction according to BOLT3.
     * This method is a low level commitment transaction builder, meaning
     * it accepts primatives and constructs a commitment transaction
     * accordingly. The proper inputs are determiend
     *
     * @param isFunderLocal True when the funding node is local. This
     * is used to determine which output pays fees (to_local/to_remote).
     * @param commitmentNumber The commitment number of the transaction
     * which is used to generate the obscurred commitment number.
     * @param openPaymentBasePoint The basepoint sent in open_channel
     * which is used to generate the obscurred commitment number.
     * @param acceptPaymentBasePoint The basepoitn sent in accept_channel
     * which is used to generate the obscurred commitment number.
     * @param fundingOutPoint The outpoint of the funding transaction
     * which was established in funding_created.
     * @param dustLimitSatoshi The dust limit in sats after which outputs
     * will be prune
     * @param feePerKw The fee rate per kiloweight which will be deducted
     * from the funding node's output
     * @param localDelay The delay applied to the to_local output
     * @param localValue Value paid to the to_local RSMC output
     * @param remoteValue Value paid to the to_emote P2WPKH output
     * @param revocationPubKey The revocation public key used to in the
     * to_local and HTLC outputs
     * @param delayedPubKey The delayed public key used to spend the
     * to_local output
     * @param remotePubKey The public key used to spend the to_remote
     * output
     * @param reverseHtlcs True when the HTLC direction needs to be
     * inverted because the holder of this commitment transaction is
     * our counterparty.
     * @param localHtlcPubKey The public key used to spend HTLC outputs
     * by the commitment holder.
     * @param remoteHtlcPubKey The public key used to spend HTLC outputs
     * by the commitment counterparty.
     * @param htlcs A full list of HTLCs that will be selectively
     * included in the commitment transaction based on the feePerKw.
     */
    public static createCommitment(
        isFunderLocal: boolean,
        commitmentNumber: number,
        openPaymentBasePoint: Buffer,
        acceptPaymentBasePoint: Buffer,
        fundingOutPoint: OutPoint,
        dustLimitSatoshi: Value,
        feePerKw: bigint,
        localDelay: number,
        localValue: Value,
        remoteValue: Value,
        revocationPubKey: Buffer,
        delayedPubKey: Buffer,
        remotePubKey: Buffer,
        reverseHtlcs: boolean,
        localHtlcPubKey?: Buffer,
        remoteHtlcPubKey?: Buffer,
        htlcs: Htlc[] = [],
    ): [TxBuilder, Htlc[]] {
        const obscuredCommitmentNumber = CommitmentNumber.obscure(
            commitmentNumber,
            openPaymentBasePoint,
            acceptPaymentBasePoint,
        );

        // 1. add the input as the funding outpoint and set the nSequence
        const tx = new TxBuilder();
        tx.version = 2;
        tx.addInput(fundingOutPoint, CommitmentNumber.getSequence(obscuredCommitmentNumber));

        // 2. set the locktime to the obscurred commitment number
        tx.locktime = CommitmentNumber.getLockTime(obscuredCommitmentNumber);

        // 3. find unpruned outputs
        const unprunedHtlcs: Htlc[] = [];
        for (const htlc of htlcs) {
            const valueInSats = htlc.value.sats;
            let feeWeight: bigint;

            // HtlcDirection refers to the local nodes perception of the HTLC.
            // When isLocal, offered uses the HTLC-Timeout weight of 663. When
            // remote, the commitment is for the remote counterparty and an
            // offered HTLC is received and will be spent by the remote
            // counterparty using the HTLC-Success transaction with a weight of 703
            if (reverseHtlcs) {
                feeWeight = htlc.direction === HtlcDirection.Offered ? 703n : 663n;
            } else {
                feeWeight = htlc.direction === HtlcDirection.Offered ? 663n : 703n;
            }

            // Calculate the HTLC less fees
            const feeInSats = (feeWeight * feePerKw) / 1000n;
            const satsLessFee = valueInSats - feeInSats;

            // Only keep HTLCs greater than the dustLimitSatoshi for the tx
            if (satsLessFee >= dustLimitSatoshi.sats) {
                unprunedHtlcs.push(htlc);
            }
        }

        // 4. calculate base fee
        const weight = 724 + unprunedHtlcs.length * 172;
        const baseFee = (BigInt(weight) * feePerKw) / 1000n;

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
        const txouts: Array<[TxOut, Htlc?]> = [];
        for (const htlc of unprunedHtlcs) {
            const witnessScript: Script =
                (!reverseHtlcs && htlc.direction === HtlcDirection.Offered) ||
                (reverseHtlcs && htlc.direction === HtlcDirection.Accepted)
                    ? ScriptFactory.offeredHtlcScript(
                          htlc.paymentHash,
                          revocationPubKey,
                          localHtlcPubKey,
                          remoteHtlcPubKey,
                      )
                    : ScriptFactory.receivedHtlcScript(
                          htlc.paymentHash,
                          htlc.cltvExpiry,
                          revocationPubKey,
                          localHtlcPubKey,
                          remoteHtlcPubKey,
                      );
            const txout = new TxOut(htlc.value, Script.p2wshLock(witnessScript));
            txouts.push([txout, htlc]);
        }

        // 8. add local if unpruned
        if (localValue.sats >= dustLimitSatoshi.sats) {
            txouts.push([
                new TxOut(
                    localValue,
                    Script.p2wshLock(
                        ScriptFactory.toLocalScript(revocationPubKey, delayedPubKey, localDelay),
                    ),
                ),
            ]);
        }

        // 9. add remote if unpruned
        if (remoteValue.sats >= dustLimitSatoshi.sats) {
            txouts.push([new TxOut(remoteValue, Script.p2wpkhLock(remotePubKey))]);
        }

        // 10. sort outputs using bip69 and using cltv for htlc tiebreaks
        TxFactory.sortCommitmentOutputs(txouts);

        // add the outputs in sorted order
        const sortedHtlcs: Htlc[] = [];
        for (const [txout, htlc] of txouts) {
            tx.addOutput(txout);
            sortedHtlcs.push(htlc);
        }

        // return the tuple with the sorted htlcs
        return [tx, sortedHtlcs];
    }

    /**
     * Constructs an HTLC-Timeout transaction as defined in BOLT3. This
     * transaction spends an offered HTLC from the commitment transaction
     * and outputs the HTLC value less the fee. The output is spendable
     * via an RSMC that is sequence locked for the received by the
     * transaction owner. Finally this transaction has an absolute
     * locktime of the HTLC's cltv expiry.
     * @param commitmentTx
     * @param outputIndex
     * @param localDelay
     * @param revocationPubKey
     * @param delayedPubKey
     * @param feePerKw
     * @param htlc
     */
    public static createHtlcTimeout(
        commitmentTx: HashValue,
        outputIndex: number,
        localDelay: number,
        revocationPubKey: Buffer,
        delayedPubKey: Buffer,
        feePerKw: bigint,
        htlc: Htlc,
    ): TxBuilder {
        const tx = new TxBuilder();

        // Input points to the commmitment transaction and the BIP69
        // sorted index of the HTLC. nSequence is set to zero.
        tx.addInput(new OutPoint(commitmentTx, outputIndex), Sequence.zero());

        // calc value less fees for this transaction
        const weight = 663n;
        const fees = (weight * feePerKw) / 1000n;
        const sats = fees > htlc.value.sats ? 0 : htlc.value.sats - fees;

        // Spends a P2WSH RSMC
        tx.addOutput(
            Value.fromSats(sats),
            Script.p2wshLock(
                ScriptFactory.toLocalScript(revocationPubKey, delayedPubKey, localDelay),
            ),
        );

        // nLocktime is set to the cltvExpiry of the HTLC. This prevents
        // the HTLC-Timeout from being broadcast until after the expiry
        // has been reached.
        tx.locktime = new LockTime(htlc.cltvExpiry);

        return tx;
    }

    /**
     * Constructs an HTLC-Success transaction as defined in BOLT3. This
     * transaction spends a received HTLC form the commitment transaction
     * and outputs the HTLC value less the fee. The output is spendable
     * via an RSMC that is sequence locked for the received by the
     * transaction owner.
     * @param commitmentTx
     * @param outputIndex
     * @param localDelay
     * @param revocationPubKey
     * @param delayedPubKey
     * @param feePerKw
     * @param htlc
     */
    public static createHtlcSuccess(
        commitmentTx: HashValue,
        outputIndex: number,
        localDelay: number,
        revocationPubKey: Buffer,
        delayedPubKey: Buffer,
        feePerKw: bigint,
        htlc: Htlc,
    ): TxBuilder {
        const tx = new TxBuilder();

        // Input points to the commmitment transaction and the BIP69
        // sorted index of the HTLC. nSequence is set to zero.
        tx.addInput(new OutPoint(commitmentTx, outputIndex), Sequence.zero());

        // calc value less fees for this transaction
        const weight = 703n;
        const fees = (weight * feePerKw) / 1000n;
        const sats = fees > htlc.value.sats ? 0 : htlc.value.sats - fees;

        // Spends a P2WSH RSMC
        tx.addOutput(
            Value.fromSats(sats),
            Script.p2wshLock(
                ScriptFactory.toLocalScript(revocationPubKey, delayedPubKey, localDelay),
            ),
        );

        // nLockTime is zero since the tx owner can immediately spend
        // this transaction if they have the preimage
        tx.locktime = LockTime.zero();

        return tx;
    }

    /**
     * Sorts [output,htlc] tuples according to:
     *  - First sort by value in ascending order
     *  - Secondary by `scriptpubkey` by comparing by length first in ascending
     *  - Lastly by `cltv_expiry` in ascending order
     *
     * Two offered HTLCs with the same `amount` and `payment_hash` will
     * have identical outputs even when their `cltv_expiry` differs.
     * Ordering matters because of the provided signatures for the
     * `htlc_signatures`.
     */
    public static sortCommitmentOutputs(txouts: [TxOut, Htlc?][]) {
        txouts.sort((a, b) => {
            // compare on value
            const value = Number(a[0].value.sats - b[0].value.sats);
            if (value !== 0) return value;

            // compare on script
            const scriptCompare = a[0].scriptPubKey
                .serializeCmds()
                .compare(b[0].scriptPubKey.serializeCmds());
            if (scriptCompare !== 0) return scriptCompare;

            // tie-break on htlcs
            return b[1].cltvExpiry - a[1].cltvExpiry;
        });
    }
}
