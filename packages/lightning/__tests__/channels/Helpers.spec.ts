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

    describe(Helpers.prototype.validateFundingAmountMin.name, () => {
        it("should return false when below the amount", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(500);
            const feeRatePerKw = Value.fromSats(1000);

            // act
            const result = helpers.validateFundingAmountMin(fundingAmount, feeRatePerKw);

            // assert
            expect(result).to.equal(false);
        });

        it("should return false when equal the amount", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(724);
            const feeRatePerKw = Value.fromSats(1000);

            // act
            const result = helpers.validateFundingAmountMin(fundingAmount, feeRatePerKw);

            // assert
            expect(result).to.equal(false);
        });

        it("should return true when greater the amount", () => {
            // arrange
            const helpers = new Helpers(undefined);
            const fundingAmount = Value.fromSats(1000);
            const feeRatePerKw = Value.fromSats(1000);

            // act
            const result = helpers.validateFundingAmountMin(fundingAmount, feeRatePerKw);

            // assert
            expect(result).to.equal(true);
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
});
