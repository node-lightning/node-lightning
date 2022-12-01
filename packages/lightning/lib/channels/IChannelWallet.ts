import { Value, PrivateKey } from "@node-lightning/bitcoin";
import { CreateBasePointsResult } from "./CreateBasePointsResult";

export interface IChannelWallet {
    getFeeRateSatsPerKb(): Promise<number>;
    checkWalletHasFunds(fundingAmt: Value): Promise<boolean>;
    createFundingKey(): Promise<PrivateKey>;
    createBasePointSecrets(): Promise<CreateBasePointsResult>;
    createPerCommitmentSeed(): Promise<PrivateKey>;
}
