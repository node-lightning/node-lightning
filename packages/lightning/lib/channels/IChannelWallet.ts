import { Value, PublicKey } from "@node-lightning/bitcoin";

export interface IChannelWallet {
    getFeeRateSatsPerKb(): Promise<number>;
    checkWalletHasFunds(fundingAmt: Value): Promise<boolean>;
    getDustLimitSats(): Promise<number>;
    getNewFundingPubKey(): Promise<PublicKey>;
}
