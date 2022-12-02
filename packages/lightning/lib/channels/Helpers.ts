/* eslint-disable @typescript-eslint/require-await */
import { Network, Value } from "@node-lightning/bitcoin";
import { randomBytes } from "crypto";
import { BitField } from "../BitField";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";
import { Result } from "../Result";
import { Channel } from "./Channel";
import { ChannelSide } from "./ChannelSide";
import { IChannelWallet } from "./IChannelWallet";
import { OpenChannelRequest } from "./OpenChannelRequest";
import { OpeningError } from "./states/opening/OpeningError";
import { OpeningErrorType } from "./states/opening/OpeningErrorType";

export class Helpers {
    constructor(readonly wallet: IChannelWallet) {}

    /**
     * Constructs a `temporary_channel_id` that is unique per peer and
     * per channel as defined in BOLT 2. Refer to {@link https://github.com/node-lightning/node-lightning/blob/main/docs/routines/createTempChannelId.md}.
     * @returns 32-byte temporary_channel_id
     */
    public createTempChannelId(): Buffer {
        return randomBytes(32);
    }

    /**
     * Validates that the channel is large enough to pay fees at the
     * current feerate. This is calculated as
     *
     * ```
     * fees = 724 * fee_rate_per_kw / 100
     * ```
     * @param fundingAmount
     * @param feeRatePerKw
     * @returns
     */
    public validateFundingAmountMin(fundingAmount: Value, feeRatePerKw: Value): boolean {
        const baseCommitmentTxWeight = 724n;
        const minAmount = (baseCommitmentTxWeight * feeRatePerKw.sats) / 1000n;
        return fundingAmount.sats > minAmount;
    }

    /**
     * Validates that the funding amount is less than 2^24 if the peers
     * have not negotiated `option_support_large_channel`. If they have
     * than any amount is valid.
     * @param fundingAmount
     */
    public validateFundingAmountMax(
        fundingAmount: Value,
        local: BitField<InitFeatureFlags>,
        remote: BitField<InitFeatureFlags>,
    ): boolean {
        if (
            local.anySet(
                InitFeatureFlags.optionSupportLargeChannelOptional,
                InitFeatureFlags.optionSupportLargeChannelRequired,
            ) &&
            remote.anySet(
                InitFeatureFlags.optionSupportLargeChannelOptional,
                InitFeatureFlags.optionSupportLargeChannelRequired,
            )
        ) {
            return true;
        }

        return fundingAmount.sats < 16777216n;
    }

    /**
     * The rule as defined in BOLT 2 is that `push_msat` must be less
     * than or equal to `funding_satoshis * 1000`. Since we are using
     * the value type (which already considers sats vs msat) we simply
     * ensure that the pushAmount is lte fundingAmount.
     * @param fundingAmount
     * @param pushAmount
     * @returns
     */
    public validatePushAmount(fundingAmount: Value, pushAmount: Value) {
        return pushAmount.lte(fundingAmount);
    }

    /**
     * The dust limit exists to ensure that a transaction will be relayed
     * by the network. The dust limit is defined as the value of an output
     * that is less than the cost to spend that output at the dustFeeRate.
     * The default dustFeeRate is defined as 3000/kvb which is 3x. The
     * actual dust limit in satoshis depends on the size of the transaction
     * and several examples are defined in BOLT 3. For Lightning Network
     * commitment transactions we use the dust limit of 354 satoshis which
     * supports any segwit version transactions.
     * @param dustLimit
     */
    public validateDustLimit(dustLimit: Value) {
        return dustLimit.gte(Value.fromSats(354));
    }
}
