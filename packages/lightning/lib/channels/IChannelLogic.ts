import { Network, Tx, Value } from "@node-lightning/bitcoin";
import { BitField } from "../BitField";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";
import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { FundingCreatedMessage } from "../messages/FundingCreatedMessage";
import { OpenChannelMessage } from "../messages/OpenChannelMessage";
import { Result } from "../Result";
import { Channel } from "./Channel";
import { ChannelPreferences } from "./ChannelPreferences";
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
    createFundingTx(channel: Channel): Promise<Tx>;
    createFundingCreatedMessage(
        channel: Channel,
        signature: Buffer,
    ): Promise<FundingCreatedMessage>;
    createOpenChannelMessage(channel: Channel): Promise<OpenChannelMessage>;
    createTempChannelId(): Buffer;
    validateAcceptChannel(
        channel: Channel,
        msg: AcceptChannelMessage,
    ): Promise<Result<boolean, OpeningError>>;
    validateFundingAmountMax(
        fundingAmount: Value,
        local: BitField<InitFeatureFlags>,
        remote: BitField<InitFeatureFlags>,
    ): boolean;
    validateMinimumDepthTooLarge(depth: number);
    validatePushAmount(fundingAmount: Value, pushAmount: Value): boolean;
    validateDustLimitTooSmall(dustLimit: Value): boolean;
    validateChannelReserveDustLimit(channelReserve: Value, dustLimit: Value): boolean;
    validateChannelReserveReachable(
        fundingAmount: Value,
        pushAmount: Value,
        feeRatePerKw: Value,
        channelReserve: Value,
    ): boolean;
    validateFunderFees(fundingAmount: Value, pushAmount: Value, feeRatePerKw: Value): boolean;
    validateMaxAcceptedHtlcsTooLarge(maxAcceptedHtlcs: number): boolean;
}
