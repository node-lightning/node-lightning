import { Value, PrivateKey, TxBuilder, Tx, Network } from "@node-lightning/bitcoin";
import { IChannelWallet } from "@node-lightning/lightning";
import { CreateBasePointsResult } from "@node-lightning/lightning/dist/channels/CreateBasePointsResult";

export class Wallet implements IChannelWallet {
    constructor(readonly network: Network) {}

    public async getFeeRatePerKw(): Promise<Value> {
        throw new Error("Not implemented");
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
