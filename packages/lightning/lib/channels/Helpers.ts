import { Value } from "@node-lightning/bitcoin";
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
}
