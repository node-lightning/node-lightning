import { EcdsaSig, Network, PrivateKey, PublicKey, Value } from "@node-lightning/bitcoin";
import { expect } from "chai";
import { CommitmentNumber } from "../../lib";
import { ChannelSide } from "../../lib/channels/ChannelSide";

describe(ChannelSide.name, () => {
    describe(ChannelSide.prototype.toJSON.name, () => {
        it("serializes empty", () => {
            // arrange
            const side = new ChannelSide();

            // act
            const result = side.toJSON();

            // assert
            expect(result.balance).to.equal(undefined);
            expect(result.channelReserve).to.equal(undefined);
            expect(result.commitmentNumber).to.equal(undefined);
            expect(result.commitmentPoint).to.equal(undefined);
            expect(result.commitmentSig).to.equal(undefined);
            expect(result.delayedBasePoint).to.equal(undefined);
            expect(result.dustLimit).to.equal(undefined);
            expect(result.fundingPubKey).to.equal(undefined);
            expect(result.htlcBasePoint).to.equal(undefined);
            expect(result.htlcCounter).to.equal(undefined);
            expect(result.maxAcceptedHtlc).to.equal(undefined);
            expect(result.maxInFlightHtlcValue).to.equal(undefined);
            expect(result.minHtlcValue).to.equal(undefined);
            expect(result.nextCommitmentNumber).to.equal(undefined);
            expect(result.nextCommitmentPoint).to.equal(undefined);
            expect(result.nextCommitmentSig).to.equal(undefined);
            expect(result.paymentBasePoint).to.equal(undefined);
            expect(result.revocationBasePoint).to.equal(undefined);
            expect(result.toSelfDelayBlocks).to.equal(undefined);
        });

        it("serialzies full", () => {
            // arrange
            const side = new ChannelSide();
            side.balance = Value.fromBitcoin(1);
            side.channelReserve = Value.fromBitcoin(0.1);
            side.commitmentNumber = new CommitmentNumber(500_000n);
            side.commitmentPoint = new PrivateKey(Buffer.alloc(32, 0x01), Network.testnet).toPubKey(
                true,
            );
            side.commitmentSig = new EcdsaSig(Buffer.alloc(64, 0x00));

            side.delayedBasePoint = new PrivateKey(
                Buffer.alloc(32, 0x02),
                Network.testnet,
            ).toPubKey(true);
            side.dustLimit = Value.fromBitcoin(0.0001);
            side.fundingPubKey = new PrivateKey(Buffer.alloc(32, 0x03), Network.testnet).toPubKey(
                true,
            );
            side.htlcBasePoint = new PrivateKey(Buffer.alloc(32, 0x04), Network.testnet).toPubKey(
                true,
            );
            side.htlcCounter = 0;
            side.maxAcceptedHtlc = 100;
            side.maxInFlightHtlcValue = Value.fromBitcoin(0.1);
            side.minHtlcValue = Value.fromBitcoin(0.001);
            side.nextCommitmentNumber = new CommitmentNumber(1n);
            side.nextCommitmentPoint = new PrivateKey(
                Buffer.alloc(32, 0x05),
                Network.testnet,
            ).toPubKey(true);
            side.nextCommitmentSig = new EcdsaSig(Buffer.alloc(64, 0x01));
            side.paymentBasePoint = new PrivateKey(
                Buffer.alloc(32, 0x06),
                Network.testnet,
            ).toPubKey(true);
            side.revocationBasePoint = new PrivateKey(
                Buffer.alloc(32, 0x07),
                Network.testnet,
            ).toPubKey(true);
            side.toSelfDelayBlocks = 144;

            //  act
            const result = side.toJSON();

            // assert
            expect(result).to.deep.equal({
                balance: 1,
                channelReserve: 0.1,
                commitmentNumber: 500000n,
                commitmentPoint:
                    "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
                commitmentSig:
                    "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                delayedBasePoint:
                    "024d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d0766",
                dustLimit: 0.0001,
                fundingPubKey: "02531fe6068134503d2723133227c867ac8fa6c83c537e9a44c3c5bdbdcb1fe337",
                htlcBasePoint: "03462779ad4aad39514614751a71085f2f10e1c7a593e4e030efb5b8721ce55b0b",
                htlcCounter: 0,
                maxAcceptedHtlc: 100,
                maxInFlightHtlcValue: 0.1,
                minHtlcValue: 0.001,
                nextCommitmentNumber: 1n,
                nextCommitmentPoint:
                    "0362c0a046dacce86ddd0343c6d3c7c79c2208ba0d9c9cf24a6d046d21d21f90f7",
                nextCommitmentSig:
                    "01010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101",
                paymentBasePoint:
                    "03f006a18d5653c4edf5391ff23a61f03ff83d237e880ee61187fa9f379a028e0a",
                revocationBasePoint:
                    "02989c0b76cb563971fdc9bef31ec06c3560f3249d6ee9e5d83c57625596e05f6f",
                toSelfDelayBlocks: 144,
            });
        });
    });
});
