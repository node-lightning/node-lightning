/* eslint-disable @typescript-eslint/require-await */
import { ILogger } from "@node-lightning/logger";
import { varIntBytes } from "@node-lightning/bufio";
import {
    Value,
    PrivateKey,
    TxBuilder,
    Tx,
    Network,
    Sequence,
    TxOut,
    Script,
} from "@node-lightning/bitcoin";
import { BitcoindClient } from "@node-lightning/bitcoind";
import { UnspentTx } from "@node-lightning/bitcoind/lib/types/UnspentTx";
import { IChannelWallet } from "@node-lightning/lightning";
import { CreateBasePointsResult } from "@node-lightning/lightning/dist/channels/CreateBasePointsResult";
import crypto from "crypto";

export class ChannelWallet implements IChannelWallet {
    public logger: ILogger;

    constructor(logger: ILogger, readonly network: Network, readonly bitcoind: BitcoindClient) {
        this.logger = logger.sub(ChannelWallet.name);
    }

    /**
     * Returns a list of spendable UTXOs
     * @returns
     */
    public async getSpendableUtxos(): Promise<UnspentTx[]> {
        const unspent = await this.bitcoind.listUnspent();
        return unspent.filter(p => p.spendable && p.desc.startsWith("wpkh"));
    }

    /**
     * Obtains a `feerate_per_kw` that will ensure a transaction will be
     * immediately included in a block. This feerate will be used by the
     * commitment transaction and HTLC-Success and HTLC-Timeout secondary
     * transactions.
     *
     * This implementation uses the wallet's feerate_per_kilobyte and
     * converts it to `feerate_per_kw`. Since weight is 4 \* vbyte we
     * can divide the `feerate_per_kb` by 4 to obtain the `feerate_per_kw`.
     *
     * For example...
     *
       ```
       60 sat/byte = 60000 sats/kilobyte

       A standard commitment transaction without HTLCs is 724 weight or
       724/4 = 181 vbytes

       This would be 181*60 = 10860 sats

       The feerate_per_kiloweight would be 60000/4 = 15000 sats/kw.

       724 weight * 15000 sats/kw / 1000 = 10860 sats
       ```
     *
     * Another example:
     *
     * A standard p2wpkh transaction:
     *
        ```
        Transaction
            vsize=141
            weight=561

        In reality the vsize = ceil(weight/4)
            561/4 = 140.25 = ceil(140.25) = 141

        For the sake of simple numbers we'll treat the weight as
            4*141=564

        With a feerate of 20 sats/vbyte = 20_000 sats/kvbyte

        Transaction fees are going to be:
            2820 sats

        We can see that:
            141 vbytes * 20 sats/vbyte = 2810 sats
            141 vbytes * 20_000 sats/kvbyte / 1000 = 2810 sats
            564 weight * 5 sats/weight = 2810 sats (due to ceil)
            564 weight * 5_000 sats/kw / 1000 = 2810 sats (due to ceil)
        ```
     * So converting sats/kvbyte to sats/kw just divides by 4.
     * @returns
     */
    public async getFeeRatePerKw(): Promise<Value> {
        const result = await this.bitcoind.estimateSmartFee(1);
        const satsPerKvb = result.feerate ?? 20_000;
        return Value.fromBitcoin(satsPerKvb / 4);
    }

    /**
     * Returns the configured dust limit for the Bitcoin node backing
     * the Lightning instance. This must conform with BOLT 3 Dust Limits
     * which has a specified limit of 354 as specified in BOLT 2 in order
     * to accommodate option_shutdown_any_segwit.
     */
    public async getDustLimit(): Promise<Value> {
        return Value.fromSats(354);
    }

    /**
     * Verify with the wallet that sufficient funds available for
     * spending.
     *
     * This method uses `listunspent` RPC call to obtain a list of UTXOs
     * that are available for spending. It calculates the total available
     * and if this is greater than our requested amount we return true.
     * @param fundingAmt
     */
    public async checkWalletHasFunds(fundingAmt: Value): Promise<boolean> {
        const utxos = await this.getSpendableUtxos();
        const total = utxos
            .map(p => Value.fromBitcoin(p.amount))
            .reduce((sum, btc) => sum.add(btc), Value.zero());
        return total.gte(fundingAmt);
    }

    /**
     * Creates a new private key for use in the 2-of-2 multisig output
     * of the funding transaction.
     */
    public async createFundingKey(): Promise<PrivateKey> {
        return new PrivateKey(crypto.randomBytes(32), this.network);
    }

    /**
     * Calls the wallet to obtain new basepoint secrets for
     * `payment_basepoint_`, `_delayed_payment_basepoint_`,
     * `_htlc_basepoint` and `_revocation_basepoint_`.
     */
    public async createBasePointSecrets(): Promise<CreateBasePointsResult> {
        return {
            paymentBasePointSecret: new PrivateKey(crypto.randomBytes(32), this.network),
            delayedPaymentBasePointSecret: new PrivateKey(crypto.randomBytes(32), this.network),
            htlcBasePointSecret: new PrivateKey(crypto.randomBytes(32), this.network),
            revocationBasePointSecret: new PrivateKey(crypto.randomBytes(32), this.network),
        };
    }

    /**
     * Calls the wallet to obtain an unguessabele seed for use in the
     * per-commitment secret.
     */
    public async createPerCommitmentSeed(): Promise<Buffer> {
        return crypto.randomBytes(32);
    }

    /**
     * Wallet function that will spend one or more UTXOs to pay for the
     * outputs in the transaction. This function is responsible for
     * determining what the appropriate fee rate is for the transaction
     * and attaching a change output.
     *
     * This transaction should only use segwit BIP141 (SegWit) inputs to
     * ensure the transaction is not malleable.
     *
     * Additionally the transaction should enable opt-in full
     * replace-by-fee by setting at least one input's nSequence value to
     * 0xfffffffe or less. This is because if the funding transaction
     * fails to confirm within 2016 blocks, the fundee (accepting node)
     * will forget the channel.
     *
     * The result of this function is a completed transaction that is
     * ready for broadcast to the network.
     *
     * Note: This function needs to be refactored and improved. Weight
     * and fee calcs is pretty terrible and will fail if there is not
     * enough overflow between the selected amount and the amount+fees
     * even if there is enough in the wallet. Basically that needs to
     * be in a loop and only fail if there are no more UTXOs, but we need
     * to get this into some testable code.
     * @param builder
     */
    public async fundTx(builder: TxBuilder): Promise<Tx> {
        this.logger.info(
            "funding transaction:",
            builder.inputs.length,
            "vin,",
            builder.outputs.length,
            "vout",
        );
        const outputAmount = builder.outputs
            .map(vout => vout.value)
            .reduce((sum, val) => sum.addn(val), Value.zero());
        this.logger.debug("  output_value=", outputAmount.bitcoin.toFixed(8));

        // obtain utxos
        const utxos = await this.getSpendableUtxos();

        const inputAmount = Value.zero();
        for (const utxo of utxos) {
            builder.addInput(`${utxo.txid}:${utxo.vout}`, Sequence.rbf());

            const amount = Value.fromBitcoin(utxo.amount);
            inputAmount.add(amount);

            if (inputAmount.gt(outputAmount)) break;
        }
        this.logger.debug("  input_num=", builder.inputs.length);
        this.logger.debug("  input_value=", inputAmount.bitcoin.toFixed(8));

        // add change output
        const changeAddress = await this.bitcoind.getNewAddress(undefined, "bech32");
        const changeOutput = new TxOut(Value.zero(), Script.p2addrLock(changeAddress));
        builder.addOutput(changeOutput);

        // get the feeRatePerKw
        const feeRatePerKw = await this.getFeeRatePerKw();
        this.logger.debug("  fee_rate_per_kw=", feeRatePerKw.bitcoin.toFixed(8));

        let stdWeight =
            4 + // version
            4 + // locktime
            varIntBytes(builder.inputs.length) + // num inputs
            varIntBytes(builder.outputs.length) + // num outputs
            builder.inputs.length * (32 + 4 + varIntBytes(0) + 4) + // input - txid, vout, len(scriptSig), 4n
            builder.outputs
                .map(
                    p =>
                        8 +
                        varIntBytes(p.scriptPubKey.buffer.length) +
                        p.scriptPubKey.buffer.length,
                )
                .reduce((sum, val) => sum + val); // calc the output weights
        stdWeight *= 4;
        const witnessWeight =
            2 + // flag bytes
            builder.inputs.length * (varIntBytes(2) + varIntBytes(73) + 73 + varIntBytes(33) + 33); // fixed length witness since all are p2wpkh inputs
        const weight = stdWeight + witnessWeight;
        this.logger.debug("  tx_weight=", weight);

        // calc fees
        const fees = Value.fromSats((BigInt(weight) * feeRatePerKw.sats) / 1000n);
        this.logger.debug("  fee_value=", fees.bitcoin.toFixed(8));

        // check for overflow
        if (outputAmount.addn(fees).gt(inputAmount)) {
            throw new Error("Failed to fund");
        }

        // calculate change
        const change = inputAmount.subn(outputAmount).subn(fees);
        changeOutput.value = change;
        this.logger.debug("  change_value=", change.bitcoin.toFixed(8));

        // sign the transaction
        const signResult = await this.bitcoind.signTransactionWithWallet(builder.toTx().toHex());

        // return the completed transaction
        return Tx.fromHex(signResult.hex);
    }

    public async broadcastTx(tx: Tx): Promise<void> {
        await this.bitcoind.sendRawTransaction(tx.toHex());
    }

    public async getBlockHeight(): Promise<number> {
        return await this.bitcoind.getBlockCount();
    }
}
