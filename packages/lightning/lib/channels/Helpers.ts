import { PublicKey, Value } from "@node-lightning/bitcoin";
import { randomBytes } from "crypto";
import { IChannelWallet } from "./IChannelWallet";

export class Helpers {
    constructor(readonly wallet: IChannelWallet) {}

    /**
     * Checks that the wallet has funds for the funding amount. Refer to {@link https://github.com/node-lightning/node-lightning/blob/main/docs/routines/checkWalletHasFunds.md}
     * @param fundingAmount
     * @returns true when wallet has sufficient funds
     */
    public async checkWalletHasFunds(fundingAmount: Value): Promise<boolean> {
        return await this.wallet.checkWalletHasFunds(fundingAmount);
    }

    /**
     * Constructs a `temporary_channel_id` that is unique per peer and
     * per channel as defined in BOLT 2. Refer to {@link https://github.com/node-lightning/node-lightning/blob/main/docs/routines/createTempChannelId.md}.
     * @returns 32-byte temporary_channel_id
     */
    public createTempChannelId(): Buffer {
        return randomBytes(32);
    }

    /**
     * Calculate the feerate_per_kiloweight that will allow a transaction
     * to be immediately included in a block. This feerate will be used
     * by the commitment transaction and HTLC-Success and HTLC-Timeout
     * secondary transactions.
     *
     * This implementation uses the wallet's feerate_per_kilobyte and
     * converts it to feerate_per_kilweight. Since weight is 4 * vbytes
     * we can divide the feerate_per_kb by 4 to obtain the
     * feerate_per_kiloweight.
     *
     * For example...
     *
     * 60 sat/byte = 60000 sats/kilobyte
     * A standard commitment transaction without HTLCs is 724 weight or
     * 724/4 = 181 vbytes
     *
     * This would be 181*60 = 10860 sats
     *
     * The feerate_per_kiloweight would be 60000/4 = 15000 sats/kw.
     * 724 weight * 15000 sats/kw / 1000 = 10860 sats
     */
    public async calcBestFeeRatePerKw(): Promise<number> {
        const satPerKb = await this.wallet.getFeeRateSatsPerKb();
        return satPerKb / 4;
    }

    /**
     * Returns the configured dust limit for the Bitcoin node backing
     * the Lightning instance. This must conform with
     * [BOLT 3 Dust Limits](https://github.com/lightning/bolts/blob/93909f67f6a48ee3f155a6224c182e612dd5f187/03-transactions.md#dust-limits). A limit of 354 is specified in [BOLT 2](https://github.com/lightning/bolts/blob/master/02-peer-protocol.md#the-open_channel-message) in order to accommodate
     * option_any_segwit.
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    public async getDustLimit(): Promise<Value> {
        return Value.fromSats(354);
    }
}
