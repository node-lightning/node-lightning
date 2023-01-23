import { ChannelWallet } from "../lib";

describe(ChannelWallet.name, () => {
    describe(ChannelWallet.prototype.getSpendableUtxos.name, () => {
        it("should return wpkh utxos only");
    });

    describe(ChannelWallet.prototype.getFeeRatePerKw.name, () => {
        it("should return smart_fee_rate / 4");
        it("should default to smart_fee_rate of 20_000");
    });

    describe(ChannelWallet.prototype.getDustLimit.name, () => {
        it("should return default");
    });

    describe(ChannelWallet.prototype.checkWalletHasFunds.name, () => {
        it("should return true if utxos are sufficient for funding");
    });

    describe(ChannelWallet.prototype.createFundingKey.name, () => {
        it("should return a valid private key");
    });

    describe(ChannelWallet.prototype.createBasePointSecrets.name, () => {
        it("should return a valid private keys");
    });

    describe(ChannelWallet.prototype.createPerCommitmentSeed.name, () => {
        it("should return a 32-byte seed");
    });

    describe(ChannelWallet.prototype.fundTx.name, () => {
        it("should attach inputs sufficient to cover the tx");
        it("should fail if fails to fund the transaction");
    });

    describe(ChannelWallet.prototype.broadcastTx.name, () => {
        it("should broadcast the tx");
    });

    describe(ChannelWallet.prototype.getBlockHeight.name, () => {
        it("should return the block height");
    });
});
