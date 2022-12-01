import { Value, PrivateKey } from "@node-lightning/bitcoin";

export interface IChannelWallet {
    getFeeRateSatsPerKb(): Promise<number>;
    checkWalletHasFunds(fundingAmt: Value): Promise<boolean>;
    createFundingKey(): Promise<PrivateKey>;
}
