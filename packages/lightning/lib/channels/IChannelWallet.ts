import { Value, PrivateKey, TxBuilder } from "@node-lightning/bitcoin";
import { CreateBasePointsResult } from "./CreateBasePointsResult";

export interface IChannelWallet {
    getFeeRatePerKw(): Promise<Value>;
    getDustLimit(): Promise<Value>;
    checkWalletHasFunds(fundingAmt: Value): Promise<boolean>;
    createFundingKey(): Promise<PrivateKey>;
    createBasePointSecrets(): Promise<CreateBasePointsResult>;
    createPerCommitmentSeed(): Promise<Buffer>;
    fundTx(builder: TxBuilder): Promise<TxBuilder>;
    signTx(builder: TxBuilder): Promise<TxBuilder>;
}
