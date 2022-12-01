/* eslint-disable @typescript-eslint/require-await */
import { Network, PrivateKey, Value } from "@node-lightning/bitcoin";
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
}
