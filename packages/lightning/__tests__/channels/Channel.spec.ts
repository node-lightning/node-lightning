import { Network } from "@node-lightning/bitcoin";
import { expect } from "chai";
import { Channel } from "../../lib/channels/Channel";
import {
    createFakeAcceptChannel,
    createFakeChannel,
    createFakeChannelReady,
    createFakeFundingSignedMessage,
    createFakeFundingTx,
} from "../_test-utils";

describe(Channel.name, () => {
    describe(Channel.prototype.attachAcceptChannel.name, () => {
        it("attaches all properties", () => {
            // arrange
            const channel = createFakeChannel();
            const msg = createFakeAcceptChannel();

            // act
            channel.attachAcceptChannel(msg);

            // assert
            expect(channel.minimumDepth).to.equal(6);
            expect(channel.ourSide.toSelfDelayBlocks).to.equal(144);
            expect(channel.ourSide.channelReserve.sats).to.equal(20_000n);
            expect(channel.theirSide.dustLimit.sats).to.equal(354n);
            expect(channel.theirSide.minHtlcValue.sats).to.equal(200n);
            expect(channel.theirSide.maxInFlightHtlcValue.sats).to.equal(20_000n);
            expect(channel.theirSide.maxAcceptedHtlc).to.equal(30);
            expect(channel.theirSide.fundingPubKey.toHex()).to.equal(
                "03774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb",
            );
            expect(channel.theirSide.paymentBasePoint.toHex()).to.equal(
                "03d01115d548e7561b15c38f004d734633687cf4419620095bc5b0f47070afe85a",
            );
            expect(channel.theirSide.delayedBasePoint.toHex()).to.equal(
                "03f28773c2d975288bc7d1d205c3748651b075fbc6610e58cddeeddf8f19405aa8",
            );
            expect(channel.theirSide.htlcBasePoint.toHex()).to.equal(
                "03499fdf9e895e719cfd64e67f07d38e3226aa7b63678949e6e49b241a60e823e4",
            );
            expect(channel.theirSide.revocationBasePoint.toHex()).to.equal(
                "02d7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e",
            );
            expect(channel.theirSide.nextCommitmentNumber.value).to.equal(0n);
            expect(channel.theirSide.nextCommitmentPoint.toHex()).to.equal(
                "0288a618cb6027c3218a37cbe9e882379f17d87d03f6e99d0b60292478d2aded06",
            );
            expect(channel.fundingScript.toString()).to.equal(
                "52210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817982103774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb52ae",
            );
        });
    });

    describe(Channel.prototype.attachFundingTx.name, () => {
        it("attach all properties", () => {
            // arrange
            const channel = createFakeChannel().attachAcceptChannel(createFakeAcceptChannel());
            const fundingTx = createFakeFundingTx();

            // act
            channel.attachFundingTx(fundingTx);

            // assert
            expect(channel.fundingTx).to.equal(fundingTx);
            expect(channel.fundingOutPoint.txid.eq(fundingTx.txId)).to.equal(true);
            expect(channel.fundingOutPoint.outputIndex).to.equal(0);
            expect(channel.channelId.toHex()).to.equal(
                "6e7848c0fb7e9c4d336149a7fbc60d097f269cb0047917747156749b1bd5d5a0",
            );
        });
    });

    describe(Channel.prototype.attachFundingSigned.name, () => {
        it("should attach signature to our side's next signature", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx());
            const msg = createFakeFundingSignedMessage();

            // act
            channel.attachFundingSigned(msg);

            // assert
            expect(channel.ourSide.nextCommitmentSig.toHex()).to.deep.equal(
                "4e5342dc670bd1f6db706e7071be0ee30b014fea8ea81dcb51d9f3c3e2f481f33fa26e38bfba7351f05190dda1f9da5658fc56e34e8ec3dae3d4da515b58d2e9",
            );
        });
    });

    describe(Channel.prototype.revokeLocalCommitment.name, () => {
        it("stores the revoked key");

        it("moves next to current and creates next", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage());

            // act
            channel.revokeLocalCommitment();

            // assert
            expect(channel.ourSide.commitmentNumber.value).to.equal(0n);
            expect(channel.ourSide.commitmentPoint.toHex()).to.equal(
                "02037803a3228ec3a517835480ffac64c0557d9d75e0fe85861ab0be9eb224e6f8",
            );
            expect(channel.ourSide.commitmentSig.toBuffer().toString("hex")).to.equal(
                "4e5342dc670bd1f6db706e7071be0ee30b014fea8ea81dcb51d9f3c3e2f481f33fa26e38bfba7351f05190dda1f9da5658fc56e34e8ec3dae3d4da515b58d2e9",
            );

            expect(channel.ourSide.nextCommitmentNumber.value).to.equal(1n);
            expect(channel.ourSide.nextCommitmentPoint.toHex()).to.equal(
                "027eed8389cf8eb715d73111b73d94d2c2d04bf96dc43dfd5b0970d80b3617009d",
            );
            expect(channel.ourSide.nextCommitmentSig).to.equal(undefined);
        });
    });

    describe(Channel.prototype.markConfirmed.name, () => {
        it("marks the height", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage());

            // act
            channel.markConfirmed(500_000);

            // assert
            expect(channel.fundingConfirmedHeight).to.equal(500_000);
        });
    });

    describe(Channel.prototype.attachChannelReady.name, () => {
        it("moves next to current and creates next", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage());
            const msg = createFakeChannelReady();

            // act
            channel.attachChannelReady(msg);

            // assert
            expect(channel.theirSide.commitmentNumber.value).to.equal(0n);
            expect(channel.theirSide.commitmentPoint.toHex()).to.equal(
                "0288a618cb6027c3218a37cbe9e882379f17d87d03f6e99d0b60292478d2aded06",
            );

            expect(channel.theirSide.nextCommitmentNumber.value).to.equal(1n);
            expect(channel.theirSide.nextCommitmentPoint.toHex()).to.equal(
                "032405cbd0f41225d5f203fe4adac8401321a9e05767c5f8af97d51d2e81fbb206",
            );
        });
    });

    describe(".hasChannelReady", () => {
        it("returns true when nextCommitmentNumber > 0", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage())
                .attachChannelReady(createFakeChannelReady());

            // act
            const result = channel.hasChannelReady;

            // assert
            expect(result).to.equal(true);
        });

        it("returns false when nextCommitmentNumber = 0", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage());

            // act
            const result = channel.hasChannelReady;

            // assert
            expect(result).to.equal(false);
        });
    });

    describe(".readyHeight", () => {
        it("returns undefined when not confirmed", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage());

            // act
            const result = channel.readyHeight;

            // assert
            expect(result).to.equal(undefined);
        });

        it("returns height when confirmed", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage())
                .markConfirmed(500_000);

            // act
            const result = channel.readyHeight;

            // assert
            expect(result).to.equal(500_005);
        });
    });

    describe(Channel.prototype.toJSON.name, () => {
        it("should work with no data", () => {
            // arrange
            const channel = new Channel(
                "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
                Network.testnet,
                true,
            );

            // act
            const result = channel.toJSON();

            // assert
            expect(result).to.deep.equal({
                channelId: undefined,
                delayedBasePointSecret: undefined,
                feeRatePerKw: undefined,
                funder: true,
                fundingAmount: undefined,
                fundingConfirmedHeight: undefined,
                fundingKey: undefined,
                fundingOutPoint: undefined,
                fundingScript: undefined,
                fundingTx: undefined,
                htlcBasePointSecret: undefined,
                isPublic: undefined,
                minimumDepth: undefined,
                network: "testnet",
                openBlockHeight: undefined,
                ourSide: {
                    balance: undefined,
                    channelReserve: undefined,
                    commitmentNumber: undefined,
                    commitmentPoint: undefined,
                    commitmentSig: undefined,
                    delayedBasePoint: undefined,
                    dustLimit: undefined,
                    fundingPubKey: undefined,
                    htlcBasePoint: undefined,
                    htlcCounter: undefined,
                    maxAcceptedHtlc: undefined,
                    maxInFlightHtlcValue: undefined,
                    minHtlcValue: undefined,
                    nextCommitmentNumber: undefined,
                    nextCommitmentPoint: undefined,
                    nextCommitmentSig: undefined,
                    paymentBasePoint: undefined,
                    revocationBasePoint: undefined,
                    toSelfDelayBlocks: undefined,
                },
                paymentBasePointSecret: undefined,
                peerId: "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
                perCommitmentSeed: undefined,
                pushAmount: undefined,
                revocationBasePointSecret: undefined,
                state: undefined,
                temporaryId: undefined,
                theirSide: {
                    balance: undefined,
                    channelReserve: undefined,
                    commitmentNumber: undefined,
                    commitmentPoint: undefined,
                    commitmentSig: undefined,
                    delayedBasePoint: undefined,
                    dustLimit: undefined,
                    fundingPubKey: undefined,
                    htlcBasePoint: undefined,
                    htlcCounter: undefined,
                    maxAcceptedHtlc: undefined,
                    maxInFlightHtlcValue: undefined,
                    minHtlcValue: undefined,
                    nextCommitmentNumber: undefined,
                    nextCommitmentPoint: undefined,
                    nextCommitmentSig: undefined,
                    paymentBasePoint: undefined,
                    revocationBasePoint: undefined,
                    toSelfDelayBlocks: undefined,
                },
            });
        });

        it("should work with data", () => {
            // arrange
            const channel = createFakeChannel()
                .attachAcceptChannel(createFakeAcceptChannel())
                .attachFundingTx(createFakeFundingTx())
                .attachFundingSigned(createFakeFundingSignedMessage())
                .markConfirmed(500_000)
                .revokeLocalCommitment()
                .attachChannelReady(createFakeChannelReady());

            // act
            const result = channel.toJSON();

            // assert
            expect(result).to.deep.equal({
                channelId: "6e7848c0fb7e9c4d336149a7fbc60d097f269cb0047917747156749b1bd5d5a0",
                delayedBasePointSecret:
                    "0000000000000000000000000000000000000000000000000000000000000003",
                feeRatePerKw: "0.00001",
                funder: true,
                fundingAmount: "0.002",
                fundingConfirmedHeight: 500000,
                fundingKey: "0000000000000000000000000000000000000000000000000000000000000001",
                fundingOutPoint:
                    "a0d5d51b9b74567174177904b09c267f090dc6fba74961334d9c7efbc048786e:0",
                fundingScript:
                    "52210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817982103774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb52ae",
                fundingTx:
                    "020000000101000000000000000000000000000000000000000000000000000000000000000000000000ffffffff02400d0300000000004752210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817982103774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb52ae00350c0000000000160014c46c97834f6a1a27794af382f97a241fdcbde98bffffffff",
                htlcBasePointSecret:
                    "0000000000000000000000000000000000000000000000000000000000000004",
                isPublic: true,
                minimumDepth: 6,
                network: "testnet",
                openBlockHeight: undefined,
                ourSide: {
                    balance: "0.00198",
                    channelReserve: "0.0002",
                    commitmentNumber: "0",
                    commitmentPoint:
                        "02037803a3228ec3a517835480ffac64c0557d9d75e0fe85861ab0be9eb224e6f8",
                    commitmentSig:
                        "4e5342dc670bd1f6db706e7071be0ee30b014fea8ea81dcb51d9f3c3e2f481f33fa26e38bfba7351f05190dda1f9da5658fc56e34e8ec3dae3d4da515b58d2e9",
                    delayedBasePoint:
                        "02f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9",
                    dustLimit: "0.00000354",
                    fundingPubKey:
                        "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                    htlcBasePoint:
                        "02e493dbf1c10d80f3581e4904930b1404cc6c13900ee0758474fa94abe8c4cd13",
                    htlcCounter: undefined,
                    maxAcceptedHtlc: 30,
                    maxInFlightHtlcValue: "2e-7",
                    minHtlcValue: "0.000002",
                    nextCommitmentNumber: "1",
                    nextCommitmentPoint:
                        "027eed8389cf8eb715d73111b73d94d2c2d04bf96dc43dfd5b0970d80b3617009d",
                    nextCommitmentSig: undefined,
                    paymentBasePoint:
                        "02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5",
                    revocationBasePoint:
                        "022f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4",
                    toSelfDelayBlocks: 144,
                },
                paymentBasePointSecret:
                    "0000000000000000000000000000000000000000000000000000000000000002",
                peerId: "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
                perCommitmentSeed:
                    "0000000000000000000000000000000000000000000000000000000000000000",
                pushAmount: "0.00002",
                revocationBasePointSecret:
                    "0000000000000000000000000000000000000000000000000000000000000005",
                state: undefined,
                temporaryId: "0000000000000000000000000000000000000000000000000000000000000000",
                theirSide: {
                    balance: "0.00002",
                    channelReserve: "0.0002",
                    commitmentNumber: "0",
                    commitmentPoint:
                        "0288a618cb6027c3218a37cbe9e882379f17d87d03f6e99d0b60292478d2aded06",
                    commitmentSig: undefined,
                    delayedBasePoint:
                        "03f28773c2d975288bc7d1d205c3748651b075fbc6610e58cddeeddf8f19405aa8",
                    dustLimit: "0.00000354",
                    fundingPubKey:
                        "03774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb",
                    htlcBasePoint:
                        "03499fdf9e895e719cfd64e67f07d38e3226aa7b63678949e6e49b241a60e823e4",
                    htlcCounter: undefined,
                    maxAcceptedHtlc: 30,
                    maxInFlightHtlcValue: "0.0002",
                    minHtlcValue: "0.000002",
                    nextCommitmentNumber: "1",
                    nextCommitmentPoint:
                        "032405cbd0f41225d5f203fe4adac8401321a9e05767c5f8af97d51d2e81fbb206",
                    nextCommitmentSig: undefined,
                    paymentBasePoint:
                        "03d01115d548e7561b15c38f004d734633687cf4419620095bc5b0f47070afe85a",
                    revocationBasePoint:
                        "02d7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e",
                    toSelfDelayBlocks: 144,
                },
            });
        });
    });
});
