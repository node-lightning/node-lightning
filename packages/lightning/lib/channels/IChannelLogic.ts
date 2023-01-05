import { EcdsaSig, Network, PublicKey, Tx, TxBuilder, Value } from "@node-lightning/bitcoin";
import { BitField } from "../BitField";
import { Htlc } from "../domain/Htlc";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";
import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { FundingCreatedMessage } from "../messages/FundingCreatedMessage";
import { FundingLockedMessage } from "../messages/FundingLockedMessage";
import { FundingSignedMessage } from "../messages/FundingSignedMessage";
import { IWireMessage } from "../messages/IWireMessage";
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
    broadcastTx(tx: Tx): Promise<void>;
    createChannel(
        network: Network,
        options: OpenChannelRequest,
    ): Promise<Result<Channel, OpeningError>>;
    createChannelReadyMessage(channel: Channel): Promise<FundingLockedMessage>;
    createFundingCreatedMessage(
        channel: Channel,
        signature: Buffer,
    ): Promise<FundingCreatedMessage>;
    createFundingTx(channel: Channel): Promise<Tx>;
    createOpenChannelMessage(channel: Channel): Promise<OpenChannelMessage>;
    createLocalCommitmentTx(channel: Channel): Promise<[TxBuilder, Htlc[]]>;
    createRemoteCommitmentTx(channel: Channel): Promise<[TxBuilder, Htlc[]]>;
    createTempChannelId(): Buffer;
    sendMessage(peerId: string, msg: IWireMessage);
    signCommitmentTx(channel: Channel, ctx: TxBuilder): Promise<Buffer>;
    signFundingTx(channel: Channel): Promise<Tx>;
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
    validateCommitmentSig(
        channel: Channel,
        tx: TxBuilder,
        sig: EcdsaSig,
        pubkey: PublicKey,
    ): Promise<boolean>;
    validateFunderFees(fundingAmount: Value, pushAmount: Value, feeRatePerKw: Value): boolean;
    validateFundingSignedMessage(
        channel: Channel,
        msg: FundingSignedMessage,
    ): Promise<Result<boolean, OpeningError>>;
    validateMaxAcceptedHtlcsTooLarge(maxAcceptedHtlcs: number): boolean;
}
