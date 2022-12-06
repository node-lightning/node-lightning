import { Network, Value } from "@node-lightning/bitcoin";
import { BitField } from "../BitField";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";
import { OpenChannelMessage } from "../messages/OpenChannelMessage";
import { Result } from "../Result";
import { Channel } from "./Channel";
import { OpenChannelRequest } from "./OpenChannelRequest";
import { OpeningError } from "./states/opening/OpeningError";

/**
 * Provides a facade for channel related logic. This is largely where
 * our "subroutines" for implementing the BOLT specs will live, however
 * abstracting it behind a facade gives our state machines a single
 * point of entry for calling these functions regardless of how the
 * actual code is organized.
 */
export interface IChannelLogic {
    createChannel(
        network: Network,
        options: OpenChannelRequest,
    ): Promise<Result<Channel, OpeningError>>;
    createOpenChannelMessage(channel: Channel): Promise<OpenChannelMessage>;
    createTempChannelId(): Buffer;
    validateFundingAmountMax(
        fundingAmount: Value,
        local: BitField<InitFeatureFlags>,
        remote: BitField<InitFeatureFlags>,
    ): boolean;
    validatePushAmount(fundingAmount: Value, pushAmount: Value): boolean;
    validateDustLimit(dustLimit: Value): boolean;
    validateChannelReserveDustLimit(channelReserve: Value, dustLimit: Value): boolean;
    validateChannelReserveReachable(
        fundingAmount: Value,
        pushAmount: Value,
        feeRatePerKw: Value,
        channelReserve: Value,
    ): boolean;
    validateFunderFees(fundingAmount: Value, pushAmount: Value, feeRatePerKw: Value): boolean;
    validateMaxAcceptedHtlcs(maxAcceptedHtlcs: number): boolean;
}
