import { Value, PublicKey } from "@node-lightning/bitcoin";

export interface IChannelWallet {
    getFeeRateSatsPerKb(): Promise<number>;
    checkWalletHasFunds(fundingAmt: Value): Promise<boolean>;
    getNewPubKey(): Promise<PublicKey>;
}
