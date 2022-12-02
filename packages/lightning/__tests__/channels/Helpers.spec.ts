import { Value } from "@node-lightning/bitcoin";
import { expect } from "chai";
import { BitField, InitFeatureFlags } from "../../lib";
import { Helpers } from "../../lib/channels/Helpers";

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

    describe(Helpers.prototype.validateDustLimit.name, () => {
        it("returns true when equal to 354", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const dustLimit = Value.fromSats(354);

            // act
            const result = helpers.validateDustLimit(dustLimit);

            // assert
            expect(result).to.equal(true);
        });

        it("returns true when above 354", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const dustLimit = Value.fromBitcoin(355);

            // act
            const result = helpers.validateDustLimit(dustLimit);

            // assert
            expect(result).to.equal(true);
        });

        it("returns false when below 354", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const dustLimit = Value.fromSats(1);

            // act
            const result = helpers.validateDustLimit(dustLimit);

            // assert
            expect(result).to.equal(false);
        });
    });

    describe(Helpers.prototype.validateChannelReserveDustLimit.name, () => {
        it("should return true when greater than the dust limit", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const dustLimit = Value.fromSats(354);
            const channelReserve = Value.fromSats(356);

            // act
            const result = helpers.validateChannelReserveDustLimit(channelReserve, dustLimit);

            // assert
            expect(result).to.equal(true);
        });

        it("should return true when equal to the dust limit", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const dustLimit = Value.fromSats(354);
            const channelReserve = Value.fromSats(354);

            // act
            const result = helpers.validateChannelReserveDustLimit(channelReserve, dustLimit);

            // assert
            expect(result).to.equal(true);
        });

        it("should return false when less than the dust limit", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const dustLimit = Value.fromSats(354);
            const channelReserve = Value.fromSats(353);

            // act
            const result = helpers.validateChannelReserveDustLimit(channelReserve, dustLimit);

            // assert
            expect(result).to.equal(false);
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
});
