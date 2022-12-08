import { Network, PrivateKey, Value } from "@node-lightning/bitcoin";
import { expect } from "chai";
import { BitField, InitFeatureFlags, OpenChannelMessage } from "../../lib";
import { ChannelPreferences } from "../../lib/channels/ChannelPreferences";
import { Helpers } from "../../lib/channels/Helpers";
import { IChannelWallet } from "../../lib/channels/IChannelWallet";
import { OpenChannelRequest } from "../../lib/channels/OpenChannelRequest";
import { OpeningErrorType } from "../../lib/channels/states/opening/OpeningErrorType";
import {
    createFakeChannel,
    createFakeChannelWallet,
    createFakeKey,
    createFakePeer,
} from "../_test-utils";

describe(Helpers.name, () => {
    describe(Helpers.prototype.createTempChannelId.name, () => {
        it("should return a random 32-byte nonce", () => {
            // arrange
            const helpers = new Helpers(undefined);

            // act
            const result = helpers.createTempChannelId();

            // assert
            expect(result.length).to.equal(32);
        });
    });

    describe(Helpers.prototype.validateFundingAmountMax.name, () => {
        it("returns true when funding over 2**24 with large channels support", () => {
            // arrange
            const local = new BitField<InitFeatureFlags>();
            local.set(InitFeatureFlags.optionSupportLargeChannelOptional);
            const remote = new BitField<InitFeatureFlags>();
            remote.set(InitFeatureFlags.optionSupportLargeChannelOptional);
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(2 ** 24 + 1);

            // act
            const result = helpers.validateFundingAmountMax(fundingAmount, local, remote);

            // assert
            expect(result).to.equal(true);
        });

        it("returns false when funding over 2**24 when only local supports large channels", () => {
            // arrange
            const local = new BitField<InitFeatureFlags>();
            local.set(InitFeatureFlags.optionSupportLargeChannelOptional);
            const remote = new BitField<InitFeatureFlags>();
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(2 ** 24 + 1);

            // act
            const result = helpers.validateFundingAmountMax(fundingAmount, local, remote);

            // assert
            expect(result).to.equal(false);
        });

        it("returns false when funding over 2**24 when only remote supports large channels", () => {
            // arrange
            const local = new BitField<InitFeatureFlags>();
            const remote = new BitField<InitFeatureFlags>();
            remote.set(InitFeatureFlags.optionSupportLargeChannelOptional);
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(2 ** 24 + 1);

            // act
            const result = helpers.validateFundingAmountMax(fundingAmount, local, remote);

            // assert
            expect(result).to.equal(false);
        });

        it("returns true when below 2**24", () => {
            // arrange
            const local = new BitField<InitFeatureFlags>();
            const remote = new BitField<InitFeatureFlags>();
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1000);

            // act
            const result = helpers.validateFundingAmountMax(fundingAmount, local, remote);

            // assert
            expect(result).to.equal(true);
        });
    });

    describe(Helpers.prototype.validatePushAmount.name, () => {
        it("returns true when equal to the funding amount", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1000);
            const pushAmount = Value.fromSats(1000);

            // act
            const result = helpers.validatePushAmount(fundingAmount, pushAmount);

            // assert
            expect(result).to.equal(true);
        });

        it("returns true when less than to the funding amount", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1000);
            const pushAmount = Value.fromSats(0);

            // act
            const result = helpers.validatePushAmount(fundingAmount, pushAmount);

            // assert
            expect(result).to.equal(true);
        });

        it("returns false when greater than the funding amount", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1000);
            const pushAmount = Value.fromSats(1001);

            // act
            const result = helpers.validatePushAmount(fundingAmount, pushAmount);

            // assert
            expect(result).to.equal(false);
        });
    });

    describe(Helpers.prototype.validateDustLimitTooSmall.name, () => {
        it("returns true when equal to 354", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const dustLimit = Value.fromSats(354);

            // act
            const result = helpers.validateDustLimitTooSmall(dustLimit);

            // assert
            expect(result).to.equal(true);
        });

        it("returns true when above 354", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const dustLimit = Value.fromBitcoin(355);

            // act
            const result = helpers.validateDustLimitTooSmall(dustLimit);

            // assert
            expect(result).to.equal(true);
        });

        it("returns false when below 354", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const dustLimit = Value.fromSats(1);

            // act
            const result = helpers.validateDustLimitTooSmall(dustLimit);

            // assert
            expect(result).to.equal(false);
        });
    });

    describe(Helpers.prototype.validateChannelReserveDustLimit.name, () => {
        describe("open_channel", () => {
            it("should return true when greater than the dust limit", () => {
                // arrange
                const helpers = new Helpers(undefined);
                const openDustLimit = Value.fromSats(354);
                const openChannelReserve = Value.fromSats(356);

                // act
                const result = helpers.validateChannelReserveDustLimit(
                    openChannelReserve,
                    openDustLimit,
                );

                // assert
                expect(result).to.equal(true);
            });

            it("should return true when equal to the dust limit", () => {
                // arrange
                const helpers = new Helpers(undefined);
                const openDustLimit = Value.fromSats(354);
                const openChannelReserve = Value.fromSats(354);

                // act
                const result = helpers.validateChannelReserveDustLimit(
                    openChannelReserve,
                    openDustLimit,
                );

                // assert
                expect(result).to.equal(true);
            });

            it("should return false when less than the dust limit", () => {
                // arrange
                const helpers = new Helpers(undefined);
                const openDustLimit = Value.fromSats(354);
                const openChannelReserve = Value.fromSats(353);

                // act
                const result = helpers.validateChannelReserveDustLimit(
                    openChannelReserve,
                    openDustLimit,
                );

                // assert
                expect(result).to.equal(false);
            });
        });

        describe("accept_channel", () => {
            it("should return true when both dust_limit <= channel_reserve", () => {
                // arrange
                const helpers = new Helpers(undefined);
                const openDustLimit = Value.fromSats(354);
                const openChannelReserve = Value.fromSats(354);
                const acceptDustLimit = Value.fromSats(354);
                const acceptChannelReserve = Value.fromSats(354);

                // act
                const result = helpers.validateChannelReserveDustLimit(
                    openChannelReserve,
                    openDustLimit,
                    acceptChannelReserve,
                    acceptDustLimit,
                );

                // assert
                expect(result).to.equal(true);
            });

            it("should return false when funder channel_reserve too low", () => {
                // arrange
                const helpers = new Helpers(undefined);
                const openDustLimit = Value.fromSats(354);
                const openChannelReserve = Value.fromSats(354);
                const acceptDustLimit = Value.fromSats(354);
                const acceptChannelReserve = Value.fromSats(353);

                // act
                const result = helpers.validateChannelReserveDustLimit(
                    openChannelReserve,
                    openDustLimit,
                    acceptChannelReserve,
                    acceptDustLimit,
                );

                // assert
                expect(result).to.equal(false);
            });

            it("should return false when fundee dust_limit too high", () => {
                // arrange
                const helpers = new Helpers(undefined);
                const openDustLimit = Value.fromSats(354);
                const openChannelReserve = Value.fromSats(354);
                const acceptDustLimit = Value.fromSats(355);
                const acceptChannelReserve = Value.fromSats(354);

                // act
                const result = helpers.validateChannelReserveDustLimit(
                    openChannelReserve,
                    openDustLimit,
                    acceptChannelReserve,
                    acceptDustLimit,
                );

                // assert
                expect(result).to.equal(false);
            });
        });
    });

    describe(Helpers.prototype.validateChannelReserveReachable.name, () => {
        it("should return false if funders balance would be negative", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1);
            const pushAmount = Value.fromSats(0);
            const feeRatePerKw = Value.fromSats(1000);
            const channelReserve = Value.fromSats(1000);

            // act
            const result = helpers.validateChannelReserveReachable(
                fundingAmount,
                pushAmount,
                feeRatePerKw,
                channelReserve,
            );

            // assert
            expect(result).to.equal(false);
        });

        it("should return false when both below channel_reserve", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1000);
            const pushAmount = Value.fromSats(0);
            const feeRatePerKw = Value.fromSats(1000);
            const channelReserve = Value.fromSats(1000);

            // act
            const result = helpers.validateChannelReserveReachable(
                fundingAmount,
                pushAmount,
                feeRatePerKw,
                channelReserve,
            );

            // assert
            expect(result).to.equal(false);
        });

        it("should return true local greater than channel_reserve", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(2000);
            const pushAmount = Value.fromSats(0);
            const feeRatePerKw = Value.fromSats(1000);
            const channelReserve = Value.fromSats(1000);

            // act
            const result = helpers.validateChannelReserveReachable(
                fundingAmount,
                pushAmount,
                feeRatePerKw,
                channelReserve,
            );

            // assert
            expect(result).to.equal(true);
        });

        it("should return true remote greater than channel_reserve", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1475);
            const pushAmount = Value.fromSats(751);
            const feeRatePerKw = Value.fromSats(1000);
            const channelReserve = Value.fromSats(750);

            // act
            const result = helpers.validateChannelReserveReachable(
                fundingAmount,
                pushAmount,
                feeRatePerKw,
                channelReserve,
            );

            // assert
            expect(result).to.equal(true);
        });
    });

    describe(Helpers.prototype.validateFunderFees.name, () => {
        it("should return false if funders value would be negative", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1000);
            const pushAmount = Value.fromSats(1000);
            const feeRatePerKw = Value.fromSats(1000);

            // act
            const result = helpers.validateFunderFees(fundingAmount, pushAmount, feeRatePerKw);

            // assert
            expect(result).to.equal(false);
        });

        it("should return false when funder can't pay fees", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1724);
            const pushAmount = Value.fromSats(1000);
            const feeRatePerKw = Value.fromSats(1000);

            // act
            const result = helpers.validateFunderFees(fundingAmount, pushAmount, feeRatePerKw);

            // assert
            expect(result).to.equal(false);
        });

        it("should return true when funder can pay fees", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1725);
            const pushAmount = Value.fromSats(1000);
            const feeRatePerKw = Value.fromSats(1000);

            // act
            const result = helpers.validateFunderFees(fundingAmount, pushAmount, feeRatePerKw);

            // assert
            expect(result).to.equal(true);
        });
    });

    describe(Helpers.prototype.validateMaxAcceptedHtlcsTooLarge.name, () => {
        it("should return true when equal to 483", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const maxAcceptedHtlc = 483;

            // act
            const result = helpers.validateMaxAcceptedHtlcsTooLarge(maxAcceptedHtlc);

            // assert
            expect(result).to.equal(true);
        });

        it("should return true when less than 483", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const maxAcceptedHtlc = 482;

            // act
            const result = helpers.validateMaxAcceptedHtlcsTooLarge(maxAcceptedHtlc);

            // assert
            expect(result).to.equal(true);
        });

        it("should return false when above 483", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const maxAcceptedHtlc = 484;

            // act
            const result = helpers.validateMaxAcceptedHtlcsTooLarge(maxAcceptedHtlc);

            // assert
            expect(result).to.equal(false);
        });
    });

    describe(Helpers.prototype.validateMaxAcceptedHtlcsTooSmall.name, () => {
        it("should return false when 0", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const maxAcceptedHtlc = 0;
            const preferences = new ChannelPreferences();

            // act
            const result = helpers.validateMaxAcceptedHtlcsTooSmall(maxAcceptedHtlc, preferences);

            // assert
            expect(result).to.equal(false);
        });

        it("should return true when > 0", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const maxAcceptedHtlc = 1;
            const preferences = new ChannelPreferences();

            // act
            const result = helpers.validateMaxAcceptedHtlcsTooSmall(maxAcceptedHtlc, preferences);

            // assert
            expect(result).to.equal(true);
        });
    });

    describe(Helpers.prototype.createChannel.name, () => {
        it("should return error when wallet doesn't have enough funds", async () => {
            // arrange
            const wallet = createFakeChannelWallet();
            wallet.checkWalletHasFunds.resolves(false);

            const helpers = new Helpers(wallet);

            const options: OpenChannelRequest = {
                peer: createFakePeer(),
                ourOptions: new BitField<InitFeatureFlags>(),
                fundingAmount: Value.fromSats(1_000_000),
                pushAmount: Value.fromSats(1000),
                maxAcceptedHtlcs: 483,
                minHtlcValue: Value.fromSats(1000),
                maxHtlcInFlightValue: Value.fromSats(1_000_000),
                channelReserveValue: Value.fromSats(10_000),
                toSelfBlockDelay: 144,
                publicChannel: true,
            };

            // act
            const result = await helpers.createChannel(Network.testnet, options);

            // assert
            expect(result.isErr).to.equal(true);
            expect(result.error.type).to.equal(OpeningErrorType.FundsNotAvailable);
        });

        it("should return error when funding amount is invalid", async () => {
            // arrange
            const wallet = createFakeChannelWallet();
            wallet.checkWalletHasFunds.resolves(true);

            const helpers = new Helpers(wallet);

            const options: OpenChannelRequest = {
                peer: createFakePeer(),
                ourOptions: new BitField<InitFeatureFlags>(),
                fundingAmount: Value.fromSats(2 ** 24),
                pushAmount: Value.fromSats(1000),
                maxAcceptedHtlcs: 483,
                minHtlcValue: Value.fromSats(1000),
                maxHtlcInFlightValue: Value.fromSats(1_000_000),
                channelReserveValue: Value.fromSats(10_000),
                toSelfBlockDelay: 144,
                publicChannel: true,
            };

            // act
            const result = await helpers.createChannel(Network.testnet, options);

            // assert
            expect(result.isErr).to.equal(true);
            expect(result.error.type).to.equal(OpeningErrorType.FundingAmountTooHigh);
        });

        it("should return error when funder fee payment is impossible", async () => {
            // arrange
            const wallet = createFakeChannelWallet();
            wallet.checkWalletHasFunds.resolves(true);
            wallet.getFeeRatePerKw.resolves(Value.fromSats(15000));

            const helpers = new Helpers(wallet);

            const options: OpenChannelRequest = {
                peer: createFakePeer(),
                ourOptions: new BitField<InitFeatureFlags>(),
                fundingAmount: Value.fromSats(1000),
                pushAmount: Value.fromSats(0),
                maxAcceptedHtlcs: 483,
                minHtlcValue: Value.fromSats(1000),
                maxHtlcInFlightValue: Value.fromSats(1_000_000),
                channelReserveValue: Value.fromSats(10_000),
                toSelfBlockDelay: 144,
                publicChannel: true,
            };

            // act
            const result = await helpers.createChannel(Network.testnet, options);

            // assert
            expect(result.isErr).to.equal(true);
            expect(result.error.type).to.equal(OpeningErrorType.FundingAmountTooLow);
        });

        it("should return error when push amount is invalid", async () => {
            // arrange
            const wallet = createFakeChannelWallet();
            wallet.checkWalletHasFunds.resolves(true);
            wallet.getFeeRatePerKw.resolves(Value.fromSats(0));

            const helpers = new Helpers(wallet);

            const options: OpenChannelRequest = {
                peer: createFakePeer(),
                ourOptions: new BitField<InitFeatureFlags>(),
                fundingAmount: Value.fromSats(500_000),
                pushAmount: Value.fromSats(500_001),
                maxAcceptedHtlcs: 483,
                minHtlcValue: Value.fromSats(1000),
                maxHtlcInFlightValue: Value.fromSats(1_000_000),
                channelReserveValue: Value.fromSats(10_000),
                toSelfBlockDelay: 144,
                publicChannel: true,
            };

            // act
            const result = await helpers.createChannel(Network.testnet, options);

            // assert
            expect(result.isErr).to.equal(true);
            expect(result.error.type).to.equal(OpeningErrorType.PushAmountTooHigh);
        });

        it("should return error when dust limit is invalid", async () => {
            // arrange
            const wallet = createFakeChannelWallet();
            wallet.checkWalletHasFunds.resolves(true);
            wallet.getFeeRatePerKw.resolves(Value.fromSats(250));
            wallet.getDustLimit.resolves(Value.fromSats(353));

            const helpers = new Helpers(wallet);

            const options: OpenChannelRequest = {
                peer: createFakePeer(),
                ourOptions: new BitField<InitFeatureFlags>(),
                fundingAmount: Value.fromSats(1_000_000),
                pushAmount: Value.fromSats(1000),
                maxAcceptedHtlcs: 483,
                minHtlcValue: Value.fromSats(1000),
                maxHtlcInFlightValue: Value.fromSats(1_000_000),
                channelReserveValue: Value.fromSats(10_000),
                toSelfBlockDelay: 144,
                publicChannel: true,
            };

            // act
            const result = await helpers.createChannel(Network.testnet, options);

            // assert
            expect(result.isErr).to.equal(true);
            expect(result.error.type).to.equal(OpeningErrorType.DustLimitTooLow);
        });

        it("should return error when channel_reserve is below dust_limit", async () => {
            // arrange
            const wallet = createFakeChannelWallet();
            wallet.checkWalletHasFunds.resolves(true);
            wallet.getFeeRatePerKw.resolves(Value.fromSats(250));
            wallet.getDustLimit.resolves(Value.fromSats(354));

            const helpers = new Helpers(wallet);

            const options: OpenChannelRequest = {
                peer: createFakePeer(),
                ourOptions: new BitField<InitFeatureFlags>(),
                fundingAmount: Value.fromSats(1_000_000),
                pushAmount: Value.fromSats(1000),
                maxAcceptedHtlcs: 483,
                minHtlcValue: Value.fromSats(1000),
                maxHtlcInFlightValue: Value.fromSats(1_000_000),
                channelReserveValue: Value.fromSats(353),
                toSelfBlockDelay: 144,
                publicChannel: true,
            };

            // act
            const result = await helpers.createChannel(Network.testnet, options);

            // assert
            expect(result.isErr).to.equal(true);
            expect(result.error.type).to.equal(OpeningErrorType.ChannelReserveTooLow);
        });

        it("should return error when channel_reserve is unreachable", async () => {
            // arrange
            const wallet = createFakeChannelWallet();
            wallet.checkWalletHasFunds.resolves(true);
            wallet.getFeeRatePerKw.resolves(Value.fromSats(250));
            wallet.getDustLimit.resolves(Value.fromSats(354));

            const helpers = new Helpers(wallet);

            const options: OpenChannelRequest = {
                peer: createFakePeer(),
                ourOptions: new BitField<InitFeatureFlags>(),
                fundingAmount: Value.fromSats(1_000_000),
                pushAmount: Value.fromSats(1000),
                maxAcceptedHtlcs: 483,
                minHtlcValue: Value.fromSats(1000),
                maxHtlcInFlightValue: Value.fromSats(1_000_000),
                channelReserveValue: Value.fromSats(1_000_000),
                toSelfBlockDelay: 144,
                publicChannel: true,
            };

            // act
            const result = await helpers.createChannel(Network.testnet, options);

            // assert
            expect(result.isErr).to.equal(true);
            expect(result.error.type).to.equal(OpeningErrorType.ChannelReserveUnreachable);
        });

        it("should return error when max_accepted_htlcs is invalid", async () => {
            // arrange
            const wallet = createFakeChannelWallet();
            wallet.checkWalletHasFunds.resolves(true);
            wallet.getFeeRatePerKw.resolves(Value.fromSats(250));
            wallet.getDustLimit.resolves(Value.fromSats(354));

            const helpers = new Helpers(wallet);

            const options: OpenChannelRequest = {
                peer: createFakePeer(),
                ourOptions: new BitField<InitFeatureFlags>(),
                fundingAmount: Value.fromSats(1_000_000),
                pushAmount: Value.fromSats(1000),
                maxAcceptedHtlcs: 484,
                minHtlcValue: Value.fromSats(1000),
                maxHtlcInFlightValue: Value.fromSats(1_000_000),
                channelReserveValue: Value.fromSats(10_000),
                toSelfBlockDelay: 144,
                publicChannel: true,
            };

            // act
            const result = await helpers.createChannel(Network.testnet, options);

            // assert
            expect(result.isErr).to.equal(true);
            expect(result.error.type).to.equal(OpeningErrorType.MaxAcceptedHtlcsTooHigh);
        });

        it("should return a partially constructed channel", async () => {
            // arrange
            const fundingKey = createFakeKey(1n);
            const paymentBasePointSecret = createFakeKey(2n);
            const delayedPaymentBasePointSecret = createFakeKey(3n);
            const htlcBasePointSecret = createFakeKey(4n);
            const revocationBasePointSecret = createFakeKey(5n);
            const perCommitmentSeed = Buffer.alloc(32);

            const wallet = createFakeChannelWallet();
            wallet.checkWalletHasFunds.resolves(true);
            wallet.getFeeRatePerKw.resolves(Value.fromSats(250));
            wallet.getDustLimit.resolves(Value.fromSats(354));
            wallet.createFundingKey.resolves(fundingKey);
            wallet.createBasePointSecrets.resolves({
                paymentBasePointSecret,
                delayedPaymentBasePointSecret,
                htlcBasePointSecret,
                revocationBasePointSecret,
            });
            wallet.createPerCommitmentSeed.resolves(perCommitmentSeed);

            const helpers = new Helpers(wallet);

            const options: OpenChannelRequest = {
                peer: createFakePeer(),
                ourOptions: new BitField<InitFeatureFlags>(),
                fundingAmount: Value.fromSats(1_000_000),
                pushAmount: Value.fromSats(1000),
                maxAcceptedHtlcs: 483,
                minHtlcValue: Value.fromSats(1000),
                maxHtlcInFlightValue: Value.fromSats(1_000_000),
                channelReserveValue: Value.fromSats(10_000),
                toSelfBlockDelay: 144,
                publicChannel: true,
            };

            // act
            const result = await helpers.createChannel(Network.testnet, options);

            // assert
            expect(result.isOk).to.equal(true);

            const channel = result.value;
            expect(channel.peerId).to.equal(
                "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
            );
            expect(channel.network).to.equal(Network.testnet);
            expect(channel.funder).to.equal(true);
            expect(channel.temporaryId.length).to.equal(32);

            expect(channel.feeRatePerKw.sats).to.equal(250n);
            expect(channel.fundingAmount.sats).to.equal(1_000_000n);
            expect(channel.pushAmount.sats).to.equal(1000n);
            expect(channel.fundingKey.toHex()).to.equal(fundingKey.toHex());
            expect(channel.paymentBasePointSecret.toHex()).to.equal(paymentBasePointSecret.toHex());
            expect(channel.delayedBasePointSecret.toHex()).to.equal(
                delayedPaymentBasePointSecret.toHex(),
            );
            expect(channel.htlcBasePointSecret.toHex()).to.equal(htlcBasePointSecret.toHex());
            expect(channel.revocationBasePointSecret.toHex()).to.equal(
                revocationBasePointSecret.toHex(),
            );
            expect(channel.perCommitmentSeed.toString("hex")).to.equal(
                perCommitmentSeed.toString("hex"),
            );

            expect(channel.ourSide.commitmentNumber.value).to.equal(0n);
            expect(channel.ourSide.htlcCounter).to.equal(undefined);
            expect(channel.ourSide.channelReserve).to.equal(undefined);
            expect(channel.ourSide.dustLimit.sats).to.equal(354n);
            expect(channel.ourSide.maxAcceptedHtlc).to.equal(483);
            expect(channel.ourSide.maxInFlightHtlcValue.sats).to.equal(1_000_000n);
            expect(channel.ourSide.minHtlcValue.sats).to.equal(1000n);
            expect(channel.ourSide.toSelfDelayBlocks).to.equal(undefined);
            expect(channel.ourSide.fundingPubKey.toHex()).to.equal(
                fundingKey.toPubKey(true).toHex(),
            );
            expect(channel.ourSide.paymentBasePoint.toHex()).to.equal(
                paymentBasePointSecret.toPubKey(true).toHex(),
            );
            expect(channel.ourSide.delayedBasePoint.toHex()).to.equal(
                delayedPaymentBasePointSecret.toPubKey(true).toHex(),
            );
            expect(channel.ourSide.htlcBasePoint.toHex()).to.equal(
                htlcBasePointSecret.toPubKey(true).toHex(),
            );
            expect(channel.ourSide.revocationBasePoint.toHex()).to.equal(
                revocationBasePointSecret.toPubKey(true).toHex(),
            );
            expect(channel.ourSide.commitmentPoint.toHex()).to.equal(
                new PrivateKey(
                    Buffer.from(
                        "02a40c85b6f28da08dfdbe0926c53fab2de6d28c10301f8f7c4073d5e42e3148",
                        "hex",
                    ),
                    Network.testnet,
                )
                    .toPubKey(true)
                    .toHex(),
            );
            expect(channel.ourSide.nextCommitmentPoint).to.equal(undefined);

            expect(channel.theirSide.commitmentNumber.value).to.equal(0n);
            expect(channel.theirSide.htlcCounter).to.equal(undefined);
            expect(channel.theirSide.channelReserve.sats).to.equal(10_000n);
            expect(channel.theirSide.dustLimit).to.be.equal(undefined);
            expect(channel.theirSide.maxAcceptedHtlc).to.equal(undefined);
            expect(channel.theirSide.maxInFlightHtlcValue).to.equal(undefined);
            expect(channel.theirSide.minHtlcValue).to.equal(undefined);
            expect(channel.theirSide.toSelfDelayBlocks).to.equal(144);
            expect(channel.theirSide.fundingPubKey).to.equal(undefined);
            expect(channel.theirSide.paymentBasePoint).to.equal(undefined);
            expect(channel.theirSide.delayedBasePoint).to.equal(undefined);
            expect(channel.theirSide.htlcBasePoint).to.equal(undefined);
            expect(channel.theirSide.revocationBasePoint).to.equal(undefined);
            expect(channel.theirSide.commitmentPoint).to.equal(undefined);
            expect(channel.theirSide.nextCommitmentPoint).to.equal(undefined);
        });
    });

    describe(Helpers.prototype.createOpenChannelMessage.name, () => {
        it("constructs the message from properties", async () => {
            // arrange
            const ourFundingSecret = createFakeKey(1n);
            const ourPaymentSecret = createFakeKey(2n);
            const ourDelayedPaymentSecret = createFakeKey(3n);
            const ourHtlcSecret = createFakeKey(4n);
            const ourRevocationSecret = createFakeKey(5n);
            const ourPerCommitmentSeed = Buffer.alloc(32);

            const wallet: IChannelWallet = undefined;
            const helpers = new Helpers(wallet);
            const channel = createFakeChannel({
                ourFundingSecret,
                ourPaymentSecret,
                ourDelayedPaymentSecret,
                ourHtlcSecret,
                ourRevocationSecret,
                ourPerCommitmentSeed,
            });

            // act
            const result = await helpers.createOpenChannelMessage(channel);

            // assert
            expect(result).to.be.instanceOf(OpenChannelMessage);
            expect(result.chainHash.toString("hex")).to.equal(
                "43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000",
            );
            expect(result.temporaryChannelId.toString("hex")).to.equal(
                "0000000000000000000000000000000000000000000000000000000000000000",
            );
            expect(result.fundingAmount.sats).to.equal(200000n);
            expect(result.pushAmount.sats).to.equal(2000n);
            expect(result.feeRatePerKw.sats).to.equal(1000n);
            expect(result.dustLimit.sats).to.equal(330n);
            expect(result.maxAcceptedHtlcs).to.equal(30);
            expect(result.minHtlcValue.sats).to.equal(200n);
            expect(result.maxHtlcValueInFlight.msats).to.equal(20000n);
            expect(result.channelReserve.sats).to.equal(2000n);
            expect(result.toSelfDelay).to.equal(144);

            expect(result.fundingPubKey.toString("hex")).to.equal(
                ourFundingSecret.toPubKey(true).toHex(),
            );
            expect(result.paymentBasePoint.toString("hex")).to.equal(
                ourPaymentSecret.toPubKey(true).toHex(),
            );
            expect(result.delayedPaymentBasePoint.toString("hex")).to.equal(
                ourDelayedPaymentSecret.toPubKey(true).toHex(),
            );
            expect(result.htlcBasePoint.toString("hex")).to.equal(
                ourHtlcSecret.toPubKey(true).toHex(),
            );
            expect(result.revocationBasePoint.toString("hex")).to.equal(
                ourRevocationSecret.toPubKey(true).toHex(),
            );
            expect(result.firstPerCommitmentPoint.toString("hex")).to.equal(
                channel.ourSide.commitmentPoint.toHex(),
            );

            expect(result.announceChannel).to.equal(true);
        });
    });

    describe(Helpers.prototype.validateMinimumDepthTooLarge.name, () => {
        it("returns false when above 144", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ maxMinimumFundingDepth: 144 });

            // act
            const result = helpers.validateMinimumDepthTooLarge(145, preferences);

            // assert
            expect(result).to.equal(false);
        });

        it("returns true when equal to 144", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ maxMinimumFundingDepth: 144 });

            // act
            const result = helpers.validateMinimumDepthTooLarge(144, preferences);

            // assert
            expect(result).to.equal(true);
        });

        it("returns true when below to 144", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ maxMinimumFundingDepth: 144 });

            // act
            const result = helpers.validateMinimumDepthTooLarge(143, preferences);

            // assert
            expect(result).to.equal(true);
        });
    });

    describe(Helpers.prototype.validateToSelfDelayTooLarge.name, () => {
        it("should return true when at or below 2016", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences();
            preferences.maxAllowedTooSelfDelay = 2016;

            // act
            const result = helpers.validateToSelfDelayTooLarge(2015, preferences);

            // assert
            expect(result).to.equal(true);
        });

        it("should return true when equal to 2016", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences();

            // act
            const result = helpers.validateToSelfDelayTooLarge(2016, preferences);

            // assert
            expect(result).to.equal(true);
        });
        it("should return false when above 2016", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences();

            // act
            const result = helpers.validateToSelfDelayTooLarge(2017, preferences);

            // assert
            expect(result).to.equal(false);
        });
    });

    describe(Helpers.prototype.validateHtlcMinimumTooLarge.name, () => {
        it("should return true when below the configured channel percentage", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ maxChanPercHtlcMinimum: 10 });
            const channel = createFakeChannel({ fundingAmount: Value.fromSats(200_000) });
            const htlcMinimum = Value.fromSats(19_000);

            // act
            const result = helpers.validateHtlcMinimumTooLarge(htlcMinimum, channel, preferences);

            // assert
            expect(result).to.equal(true);
        });

        it("should return true when at the configured channel percentage", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ maxChanPercHtlcMinimum: 10 });
            const channel = createFakeChannel({ fundingAmount: Value.fromSats(200_000) });
            const htlcMinimum = Value.fromSats(20_000);

            // act
            const result = helpers.validateHtlcMinimumTooLarge(htlcMinimum, channel, preferences);

            // assert
            expect(result).to.equal(true);
        });

        it("should return false when above the configured channel percentage", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ maxChanPercHtlcMinimum: 10 });
            const channel = createFakeChannel({ fundingAmount: Value.fromSats(200_000) });
            const htlcMinimum = Value.fromSats(21_000);

            // act
            const result = helpers.validateHtlcMinimumTooLarge(htlcMinimum, channel, preferences);

            // assert
            expect(result).to.equal(false);
        });
    });

    describe(Helpers.prototype.validateMaxHtlcInFlightTooSmall.name, () => {
        it("should return true when above the configured channel percentage", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ minChanPercMaxHtlcInFlight: 1 });
            const channel = createFakeChannel({ fundingAmount: Value.fromSats(100_000) });
            const maxHtlcInFlight = Value.fromSats(2_000);

            // act
            const result = helpers.validateMaxHtlcInFlightTooSmall(
                maxHtlcInFlight,
                channel,
                preferences,
            );

            // assert
            expect(result).to.equal(true);
        });
        it("should return true when at the configured channel percentage", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ minChanPercMaxHtlcInFlight: 1 });
            const channel = createFakeChannel({ fundingAmount: Value.fromSats(100_000) });
            const maxHtlcInFlight = Value.fromSats(1_000);

            // act
            const result = helpers.validateMaxHtlcInFlightTooSmall(
                maxHtlcInFlight,
                channel,
                preferences,
            );

            // assert
            expect(result).to.equal(true);
        });
        it("should return false when below the configured channel percentage", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ minChanPercMaxHtlcInFlight: 1 });
            const channel = createFakeChannel({ fundingAmount: Value.fromSats(100_000) });
            const maxHtlcInFlight = Value.fromSats(999);

            // act
            const result = helpers.validateMaxHtlcInFlightTooSmall(
                maxHtlcInFlight,
                channel,
                preferences,
            );

            // assert
            expect(result).to.equal(false);
        });
    });

    describe(Helpers.prototype.validateChannelReserveTooLarge.name, () => {
        it("should return true when below configured channel percentage", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ maxChanPercChannelReserve: 20 });
            const channel = createFakeChannel({ fundingAmount: Value.fromSats(100_000) });
            const maxHtlcInFlight = Value.fromSats(19_999);

            // act
            const result = helpers.validateChannelReserveTooLarge(
                maxHtlcInFlight,
                channel,
                preferences,
            );

            // assert
            expect(result).to.equal(true);
        });

        it("should return true when at the configured channel percentage", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ maxChanPercChannelReserve: 20 });
            const channel = createFakeChannel({ fundingAmount: Value.fromSats(100_000) });
            const maxHtlcInFlight = Value.fromSats(20_000);

            // act
            const result = helpers.validateChannelReserveTooLarge(
                maxHtlcInFlight,
                channel,
                preferences,
            );

            // assert
            expect(result).to.equal(true);
        });

        it("should return false when above configured channel percentage", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const preferences = new ChannelPreferences({ maxChanPercChannelReserve: 20 });
            const channel = createFakeChannel({ fundingAmount: Value.fromSats(100_000) });
            const maxHtlcInFlight = Value.fromSats(20_001);

            // act
            const result = helpers.validateChannelReserveTooLarge(
                maxHtlcInFlight,
                channel,
                preferences,
            );

            // assert
            expect(result).to.equal(false);
        });
    });
});
