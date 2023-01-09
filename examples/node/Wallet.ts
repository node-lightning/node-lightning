import { Value, PrivateKey, TxBuilder, Tx, Network } from "@node-lightning/bitcoin";
import { BitcoindClient } from "@node-lightning/bitcoind";
import { IChannelWallet } from "@node-lightning/lightning";
import { CreateBasePointsResult } from "@node-lightning/lightning/dist/channels/CreateBasePointsResult";

export class Wallet implements IChannelWallet {
    constructor(readonly network: Network, readonly bitcoind: BitcoindClient) {}

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
        return Value.fromBitcoin(satsPerKvb * 4);
    }

    public async getDustLimit(): Promise<Value> {
        throw new Error("Not implemented");
    }

    public async checkWalletHasFunds(fundingAmt: Value): Promise<boolean> {
        throw new Error("Not implemented");
    }

    public async createFundingKey(): Promise<PrivateKey> {
        throw new Error("Not implemented");
    }

    public async createBasePointSecrets(): Promise<CreateBasePointsResult> {
        throw new Error("Not implemented");
    }

    public async createPerCommitmentSeed(): Promise<Buffer> {
        throw new Error("Not implemented");
    }

    public async fundTx(builder: TxBuilder): Promise<TxBuilder> {
        throw new Error("Not implemented");
    }

    public async signTx(builder: TxBuilder): Promise<TxBuilder> {
        throw new Error("Not implemented");
    }

    public async signFundingTx(tx: Tx): Promise<Tx> {
        throw new Error("Not implemented");
    }

    public async broadcastTx(tx: Tx): Promise<void> {
        throw new Error("Not implemented");
    }

    public async getBlockHeight(): Promise<number> {
        throw new Error("Not implemented");
    }
}
