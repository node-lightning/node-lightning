import { Value, PrivateKey, TxBuilder, Tx } from "@node-lightning/bitcoin";
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
    signFundingTx(tx: Tx): Promise<Tx>;
    broadcastTx(tx: Tx): Promise<void>;
}
