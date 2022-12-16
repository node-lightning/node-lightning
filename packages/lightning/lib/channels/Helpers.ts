/* eslint-disable @typescript-eslint/require-await */
import { HashByteOrder, Network, PublicKey, Tx, TxBuilder, Value } from "@node-lightning/bitcoin";
import { randomBytes } from "crypto";
import { BitField } from "../BitField";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";
import { Result } from "../Result";
import { Channel } from "./Channel";
import { IChannelWallet } from "./IChannelWallet";
import { OpenChannelRequest } from "./OpenChannelRequest";
import { OpeningError } from "./states/opening/OpeningError";
import { OpeningErrorType } from "./states/opening/OpeningErrorType";
import { OpenChannelMessage } from "../messages/OpenChannelMessage";
import { IChannelLogic } from "./IChannelLogic";
import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { ChannelPreferences } from "./ChannelPreferences";
import { TxFactory } from "./TxFactory";
import { CommitmentSecret } from "./CommitmentSecret";
import { FundingCreatedMessage } from "../messages/FundingCreatedMessage";
import { ChannelKeys } from "./ChannelKeys";
import { Htlc } from "../domain/Htlc";
import { CommitmentNumber } from "./CommitmentNumber";
import { FundingSignedMessage } from "../messages/FundingSignedMessage";
import { sigFromDER, verifySig } from "@node-lightning/crypto";

export class Helpers implements IChannelLogic {
    constructor(readonly wallet: IChannelWallet, public preferences: ChannelPreferences) {}

    /**
     * Constructs a `temporary_channel_id` that is unique per peer and
     * per channel as defined in BOLT 2. Refer to {@link https://github.com/node-lightning/node-lightning/blob/main/docs/routines/createTempChannelId.md}.
     * @returns 32-byte temporary_channel_id
     */
    public createTempChannelId(): Buffer {
        return randomBytes(32);
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
    public validatePushAmount(fundingAmount: Value, pushAmount: Value): boolean {
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
    public validateDustLimitTooSmall(dustLimit: Value): boolean {
        return dustLimit.gte(Value.fromSats(354));
    }

    /**
     * BOLT 2 specifies that the `dust_limit` must be <= `channel_reserve`.
     * Recall that the `dust_limit` value in `open_channel` and
     * `accept_channel` is for the sender and the `channel_reserve`
     * value is for the recipient.
     *
     * Initially this method only validates the `open_channel` message
     * validating that the funder's `dust_limit` is <= the fundee's
     * `channel_reserve`.
     *
     * When `accept_channel` is received we can perform a cross
     * comparison to ensure that both the funder and the fundee have
     * a `dust_limit` <= the their respective `channel_reserve`.
     * @param openDustLimit
     * @param openChannelReserve
     * @param acceptDustLimit
     * @param acceptChannelReserve
     * @returns
     */
    public validateChannelReserveDustLimit(
        openChannelReserve: Value,
        openDustLimit: Value,
        acceptChannelReserve?: Value,
        acceptDustLimit?: Value,
    ): boolean {
        const openValid = openDustLimit.lte(openChannelReserve);
        const acceptValid = acceptDustLimit
            ? acceptDustLimit.lte(openChannelReserve) && openDustLimit.lte(acceptChannelReserve)
            : true;
        return openValid && acceptValid;
    }

    /**
     * As specified in BOLT 2 an `open_channel` message's `channel_reserve`
     * value will be failed if both the `to_local` and `to_remote` values
     * are below the `channel_reserve` value. This rule exists to ensure
     * that the `channel_reserve` cannot be maliciously set to prevent the
     * fundee from being able to send via the channel. It also guards
     * against channels that are underfunded and are unable to pay the
     * at the fee rate.
     *
     * The fees are calculated as
     *
     * ```
     * fees = 724 * `feerate_per_kw` / 100
     * ```
     *
     * We calculate the initial funder's balance as the `funding_amount`
     * less the `push_amount` and `fees`.
     *

     * @param fundingAmount
     * @param pushAmount
     * @param channelReserve
     */
    public validateChannelReserveReachable(
        fundingAmount: Value,
        pushAmount: Value,
        feeRatePerKw: Value,
        channelReserve: Value,
    ): boolean {
        const baseCommitmentTxWeight = 724n;
        const fees = Value.fromSats((baseCommitmentTxWeight * feeRatePerKw.sats) / 1000n);

        if (pushAmount.addn(fees).gt(fundingAmount)) {
            return false;
        }

        const funderBalance = fundingAmount.subn(pushAmount).subn(fees);
        const fundeeBalance = pushAmount;

        return funderBalance.gt(channelReserve) || fundeeBalance.gt(channelReserve);
    }

    /**
     * Validates that the funder has enough balance to pay fees at the
     * specified `feerate_per_kw`. The fees are calculated as
     *
     * ```
     * fees = 724 * `feerate_per_kw` / 100
     * ```
     *
     * We calculate the initial funder's balance as the `funding_amount`
     * less the `push_amount`.
     * @param fundingAmount
     * @param feeRatePerKw
     * @returns
     */
    public validateFunderFees(
        fundingAmount: Value,
        pushAmount: Value,
        feeRatePerKw: Value,
    ): boolean {
        const baseCommitmentTxWeight = 724n;
        const fees = (baseCommitmentTxWeight * feeRatePerKw.sats) / 1000n;

        if (pushAmount.gt(fundingAmount)) return false;

        const fundersBalance = fundingAmount.subn(pushAmount);
        return fundersBalance.sats > fees;
    }

    /**
     * Ensures that the max_accepted_htlcs is <= 483. This value ensures
     * that the `commitment_signed` message fits within the message length
     * and that a penalty transaction with 2x483 transactions fits within
     * the max transaction size for Bitcoin Core.
     * @param maxAcceptedHtlcs
     * @returns
     */
    public validateMaxAcceptedHtlcsTooLarge(maxAcceptedHtlcs: number): boolean {
        return maxAcceptedHtlcs <= 483;
    }

    /**
     * BOLT 2 specifies that the receiver of an `open_channel` or
     * `accept_channel` message must validate that the `max_accepted_htlcs`
     * value is not too small. This value must be at least greater than 0
     * or else the channel will be unusable.
     * @param maxAcceptedHtlc
     * @param channelPreferences
     * @returns
     */
    public validateMaxAcceptedHtlcsTooSmall(maxAcceptedHtlc: number): boolean {
        return maxAcceptedHtlc >= this.preferences.minMaxAcceptedHtlcs;
    }

    /**
     * Constructs a a channel for an opener as described
     * @param network
     * @param options
     * @returns
     */
    public async createChannel(
        network: Network,
        options: OpenChannelRequest,
    ): Promise<Result<Channel, OpeningError>> {
        // Must validate the `funding_satoshis` is available in the wallet
        const hasFunds = await this.wallet.checkWalletHasFunds(options.fundingAmount);
        if (!hasFunds) return Result.err(new OpeningError(OpeningErrorType.FundsNotAvailable));

        // Must set `chain_hash` to the appropriate value for the the chain
        // the node wishes to create the channel on. This value is usually
        // the genesis block in internal byte order of the block hash
        // (little-endian).
        const channel = new Channel(options.peer.id, network, true);

        // Must construct a `temporary_channel_id` that is unique to other
        //  channel ids with the same peer
        channel.temporaryId = this.createTempChannelId();

        // Should set the `feerate_per_kw` to at least a rate that would
        // get the transaction immediately included in a block
        channel.feeRatePerKw = await this.wallet.getFeeRatePerKw();

        // Must validate that `funding_satoshis` is is less than 2^24
        // when `option_channel_support_large_channels` has not been
        // negotiated with the peer
        if (
            !this.validateFundingAmountMax(
                options.fundingAmount,
                options.ourOptions,
                options.peer.remoteFeatures,
            )
        ) {
            return Result.err(new OpeningError(OpeningErrorType.FundingAmountTooHigh));
        }
        channel.fundingAmount = options.fundingAmount;

        // Must set `push_msat` <= 1000 * `funding_satoshi`
        if (!this.validatePushAmount(options.fundingAmount, options.pushAmount)) {
            return Result.err(new OpeningError(OpeningErrorType.PushAmountTooHigh));
        }
        channel.pushAmount = options.pushAmount;

        // Must validate that the `funding_satoshis` and `push_amt` is
        // sufficient for full fee payment of the initial commitment
        // transaction. This should be `724 * feerate_per_kw / 1000`.
        if (
            !this.validateFunderFees(
                options.fundingAmount,
                options.pushAmount,
                channel.feeRatePerKw,
            )
        ) {
            return Result.err(new OpeningError(OpeningErrorType.FundingAmountTooLow));
        }

        // Should set `dust_limit_satoshis` to a value sufficient to propagate transactions is sufficient to propagate transactions by checking with the Bitcoin node using `getDustLimit` subroutine.
        channel.ourSide.dustLimit = await this.wallet.getDustLimit();

        // Must set `dust_limit_satoshis` \>= 354 satoshis
        if (!this.validateDustLimitTooSmall(channel.ourSide.dustLimit)) {
            return Result.err(new OpeningError(OpeningErrorType.DustLimitTooLow));
        }

        // Must set `channel_reserve_balance` for use by the opposite node.
        channel.theirSide.channelReserve = options.channelReserveValue;

        // Must set `channel_reserve_balance` >= sent `dust_limit_satoshis` value.
        if (
            !this.validateChannelReserveDustLimit(
                channel.theirSide.channelReserve,
                channel.ourSide.dustLimit,
            )
        ) {
            return Result.err(new OpeningError(OpeningErrorType.ChannelReserveTooLow));
        }

        // Must ensure that at least one of `to_local` and `to_remote`
        // outputs is > `channel_reserve_balance`.
        if (
            !this.validateChannelReserveReachable(
                channel.fundingAmount,
                channel.pushAmount,
                channel.feeRatePerKw,
                channel.theirSide.channelReserve,
            )
        ) {
            return Result.err(new OpeningError(OpeningErrorType.ChannelReserveUnreachable));
        }

        // Should set `to_self_delay` to a value in blocks it wishes to
        // delay the peer's access to its funds in the event it broadcasts
        // its version of the commitment transaction.
        channel.theirSide.toSelfDelayBlocks = options.toSelfBlockDelay;

        // Should set `htlc_mimimum_msat` to the minimum value HTLC it
        // is willing to accept from the peer
        channel.ourSide.minHtlcValue = options.minHtlcValue;

        // Should set `max_acccepted_htlcs` to the maximum value of HTLCs
        // it is will to accept from the peer.
        channel.ourSide.maxAcceptedHtlc = options.maxAcceptedHtlcs;

        // Must set `max_accepted_htlcs` <= 483
        if (!this.validateMaxAcceptedHtlcsTooLarge(channel.ourSide.maxAcceptedHtlc)) {
            return Result.err(new OpeningError(OpeningErrorType.MaxAcceptedHtlcsTooHigh));
        }

        //  Should set `max_htlc_value_in_flight_msat` to the maximum millisatoshi value your are willing to allow for all HTLCs that are outstanding (both offerred and accepted).
        channel.ourSide.maxInFlightHtlcValue = options.maxHtlcInFlightValue;

        // Must create a `funding_pubkey` that is a valid point
        channel.fundingKey = await this.wallet.createFundingKey();

        // Must construct unique and unguessable secrets and generate
        // valid public keys for `payment_basepoint_`, `_delayed_payment_basepoint_`,
        // `_htlc_basepoint` and `_revocation_basepoint_`
        const basePoints = await this.wallet.createBasePointSecrets();
        channel.paymentBasePointSecret = basePoints.paymentBasePointSecret;
        channel.delayedBasePointSecret = basePoints.delayedPaymentBasePointSecret;
        channel.htlcBasePointSecret = basePoints.htlcBasePointSecret;
        channel.revocationBasePointSecret = basePoints.revocationBasePointSecret;

        // Must obtain a unique and unguessable seed
        channel.perCommitmentSeed = await this.wallet.createPerCommitmentSeed();

        // Must generate `first_per_commitment_point` from the seed
        channel.ourSide.nextCommitmentNumber = new CommitmentNumber(0n);
        channel.ourSide.nextCommitmentPoint = CommitmentSecret.privateKey(
            channel.perCommitmentSeed,
            channel.network,
            channel.ourSide.nextCommitmentNumber,
        ).toPubKey(true);

        return Result.ok(channel);
    }

    public async createOpenChannelMessage(channel: Channel): Promise<OpenChannelMessage> {
        const msg = new OpenChannelMessage();
        msg.chainHash = channel.network.genesisHash.serialize(HashByteOrder.Internal);
        msg.temporaryChannelId = channel.temporaryId;

        msg.fundingAmount = channel.fundingAmount;
        msg.pushAmount = channel.pushAmount;
        msg.feeRatePerKw = channel.feeRatePerKw;
        msg.dustLimit = channel.ourSide.dustLimit;
        msg.maxAcceptedHtlcs = channel.ourSide.maxAcceptedHtlc;
        msg.minHtlcValue = channel.ourSide.minHtlcValue;
        msg.maxHtlcValueInFlight = channel.ourSide.maxInFlightHtlcValue;

        msg.channelReserve = channel.theirSide.channelReserve;
        msg.toSelfDelay = channel.theirSide.toSelfDelayBlocks;

        msg.fundingPubKey = channel.ourSide.fundingPubKey.toBuffer();
        msg.paymentBasePoint = channel.ourSide.paymentBasePoint.toBuffer();
        msg.delayedPaymentBasePoint = channel.ourSide.delayedBasePoint.toBuffer();
        msg.htlcBasePoint = channel.ourSide.htlcBasePoint.toBuffer();
        msg.revocationBasePoint = channel.ourSide.revocationBasePoint.toBuffer();
        msg.firstPerCommitmentPoint = channel.ourSide.nextCommitmentPoint.toBuffer();

        msg.announceChannel = channel.isPublic;

        return msg;
    }

    /**
     * BOLT 2 specifies that the recipient of an `accept_channel` message
     * should validate that the `minimum_depth` value is not unreasonably
     * large.
     *
     * This value is set by the fundee and is the number of blocks both
     * parties must wait until `channel_ready` can be sent to transition
     * the channel into an operational state. The fundee sets this value
     * to a block depth that should ensure the funding transaction can't
     * be double-spent. Validating that `minimum_depth` is not
     * excessively large ensures that it is not being used as a
     * denial-of-service to lock funds in the channel with no intention
     * of allowing the channel to function normally.
     *
     * We set this to a value of 144 (or 1-day) however a value of 2
     * would be sufficient.
     * @param depth
     * @returns
     */
    public validateMinimumDepthTooLarge(depth: number): boolean {
        return depth <= this.preferences.maxMinimumFundingDepth;
    }

    /**
     * BOLT2 specifies that we must validate the `to_self_delay` value
     * when receiving the `open_channel` or `accept_channel` message.
     * While there is no hard limit the receiving node should not subject
     * itself to possible denial-of-service attacks. A reasonable value
     * is 1 day to 2 weeks or (1008 or 2016 blocks).
     * @param toSelfDelay
     * @returns
     */
    public validateToSelfDelayTooLarge(toSelfDelay: number): boolean {
        return toSelfDelay <= this.preferences.maxAllowedTooSelfDelay;
    }

    /**
     * BOLT 2 specifies that a receiver of either `open_channel` or
     * `accept_channel` may fail the channel if the `htlc_minimum_msat`
     * value is too large. This prevents the counterparty from making
     * the channel unusable by setting the value too high.
     * @param htlcMinium
     * @param preferences
     * @returns
     */
    public validateHtlcMinimumTooLarge(htlcMinium: Value, channel: Channel): boolean {
        const maxSats =
            (channel.fundingAmount.sats * BigInt(this.preferences.maxChanPercHtlcMinimum)) / 100n;
        return htlcMinium.lte(Value.fromSats(maxSats));
    }

    /**
     * BOLT 2 specifies that the recipient of an `open_channel` or
     * `accept_channel` may fail the channel if the `max_htlc_in_flight_msat`
     * value is too small. This rule exists to prevent a counterparty
     * from setting the value too small making the channel unusable.
     * @param maxHtlcInFlight
     * @param channel
     * @param preferences
     */
    public validateMaxHtlcInFlightTooSmall(maxHtlcInFlight: Value, channel: Channel): boolean {
        const minSats =
            (channel.fundingAmount.sats * BigInt(this.preferences.minChanPercMaxHtlcInFlight)) /
            100n;
        return maxHtlcInFlight.gte(Value.fromSats(minSats));
    }

    /**
     * BOLT 2 specifies that the receipt of a `open_channel` or
     * `accept_channel` message much validate that the received
     * `channel_reserve` value is not too large. This value exists to
     * ensure each participant in the channel has some value to lose in
     * the event of a breach. A reasonable value is considered 10% of
     * the funding amount.
     * @param channelReserve
     * @param channel
     * @param preferences
     */
    public validateChannelReserveTooLarge(channelReserve: Value, channel: Channel): boolean {
        const maxSats =
            (channel.fundingAmount.sats * BigInt(this.preferences.maxChanPercChannelReserve)) /
            100n;
        return channelReserve.lte(Value.fromSats(maxSats));
    }

    /**
     * BOLT 2 specifies that the recipient of an `open_channel` or
     * `accept_channel` may fail the channel if the `dust_limit_satoshis`
     * value is too large. Outputs below the `dust_limit_satoshis` value
     * are pruned from the commitment transaction. As a result, a value
     * that is too large is an attack vector for stealing funds through
     * fee siphoning.
     * @param dustLimit
     */
    public validateDustLimitTooLarge(dustLimit: Value): boolean {
        return dustLimit.lte(this.preferences.maxDustLimit);
    }

    /**
     * Used by the funder to validate a received `accept_channel`
     * according to rules in BOLT 2. There are several hard failures that
     * are defined at the protocol level and soft failures that are
     * configurable by the node operator.
     * @param channel
     * @param preferences
     * @param msg
     */
    public async validateAcceptChannel(
        channel: Channel,
        msg: AcceptChannelMessage,
    ): Promise<Result<boolean, OpeningError>> {
        // Must validate the dust limit is below the channel reserve for
        // both of the nodes
        if (
            !this.validateChannelReserveDustLimit(
                channel.theirSide.channelReserve,
                channel.ourSide.dustLimit,
                msg.channelReserveValue,
                msg.dustLimitValue,
            )
        ) {
            return OpeningError.toResult(OpeningErrorType.ChannelReserveDustLimitMismatch);
        }

        // Must validate that the to_self_delay value is not unreasonably
        // large
        if (!this.validateToSelfDelayTooLarge(msg.toSelfDelay)) {
            return OpeningError.toResult(OpeningErrorType.ToSelfDelayTooHigh);
        }

        // Must validate that max_accepted_htlcs is <= 483
        if (!this.validateMaxAcceptedHtlcsTooLarge(msg.maxAcceptedHtlcs)) {
            return OpeningError.toResult(OpeningErrorType.MaxAcceptedHtlcsTooHigh);
        }

        // Must validate `funding_pubkey` is a valid public key
        if (!PublicKey.isValid(msg.fundingPubKey)) {
            return OpeningError.toResult(OpeningErrorType.InvalidFundingKey);
        }

        // Must validate `payment_basepoint` is a valid public key
        if (!PublicKey.isValid(msg.paymentBasePoint)) {
            return OpeningError.toResult(OpeningErrorType.InvalidPaymentBasePoint);
        }

        // Must validate `delayed_payment_basepoint` is a valid public key
        if (!PublicKey.isValid(msg.delayedPaymentBasePoint)) {
            return OpeningError.toResult(OpeningErrorType.InvalidDelayedBasePoint);
        }

        // Must validate `revocation_basepoint` is a valid public key
        if (!PublicKey.isValid(msg.revocationBasePoint)) {
            return OpeningError.toResult(OpeningErrorType.InvalidRevocationBasePoint);
        }

        // Must validate `htlc_basepoint` is a valid public key
        if (!PublicKey.isValid(msg.htlcBasePoint)) {
            return OpeningError.toResult(OpeningErrorType.InvalidHtlcBasePoint);
        }

        // Must validate `first_per_commitment_point` is a valid public key
        if (!PublicKey.isValid(msg.firstPerCommitmentPoint)) {
            return OpeningError.toResult(OpeningErrorType.InvalidPerCommitmentPoint);
        }

        // Must validate that dust_limit_satoshis is not too small
        if (!this.validateDustLimitTooSmall(msg.dustLimitValue)) {
            return OpeningError.toResult(OpeningErrorType.DustLimitTooLow);
        }

        // May validate that `minimum_depth` is not too large
        if (!this.validateMinimumDepthTooLarge(msg.minimumDepth)) {
            return OpeningError.toResult(OpeningErrorType.MinimumDepthTooHigh);
        }

        // May validate that `htlc_minimum_msat` is not too large
        if (!this.validateHtlcMinimumTooLarge(msg.htlcMinimumValue, channel)) {
            return OpeningError.toResult(OpeningErrorType.HtlcMinimumTooHigh);
        }

        // May validate that `max_htlc_inflight` is not too small
        if (!this.validateMaxHtlcInFlightTooSmall(msg.maxHtlcValueInFlightValue, channel)) {
            return OpeningError.toResult(OpeningErrorType.MaxHtlcInFlightTooLow);
        }

        // May validate that the `channel_reserve` isn't too high
        if (!this.validateChannelReserveTooLarge(msg.channelReserveValue, channel)) {
            return OpeningError.toResult(OpeningErrorType.ChannelReserveTooHigh);
        }

        // May validate that `max_accepted_htlcs` is not too small
        if (!this.validateMaxAcceptedHtlcsTooSmall(msg.maxAcceptedHtlcs)) {
            return OpeningError.toResult(OpeningErrorType.MaxAcceptedHtlcsTooLow);
        }

        // May validate that the `dust_limit_satoshi` is not too large
        if (!this.validateDustLimitTooLarge(msg.dustLimitValue)) {
            return OpeningError.toResult(OpeningErrorType.DustLimitTooHigh);
        }

        return Result.ok(true);
    }

    /**
     * Constructs a partial transaction with one or more inputs
     * sufficient to cover the `funding_satoshis` value. Contains one or
     * more outputs, one of which must be the funding output. The funding
     * transaction is defined BOLT 3. This funding output must be a
     * P2WSH output script matching:
     *
     * ```
     * 2 <pubkey1> <pubkey2> 2 OP_CHECKMULTISIG
     * ```
     *
     * The pubkeys are the lexicographical ordering of the
     * `funding_pubkey` values. Lexicographical ordering improves privacy
     * by not leaking which of the nodes is the funding node.
     * @param channel
     * @returns
     */
    public async createFundingTx(channel: Channel): Promise<Tx> {
        const tx = new TxBuilder();
        tx.addOutput(
            TxFactory.createFundingOutput(
                channel.fundingAmount,
                channel.ourSide.fundingPubKey.toBuffer(),
                channel.theirSide.fundingPubKey.toBuffer(),
            ),
        );
        await this.wallet.fundTx(tx);
        return tx.toTx();
    }

    /**
     * This method converts the channel object into a specific commitment
     * transaction for the remote node.
     * @param channel
     * @returns
     */
    public async createRemoteCommitmentTx(channel: Channel): Promise<[TxBuilder, Htlc[]]> {
        const perCommitmentPoint = channel.theirSide.nextCommitmentPoint.toBuffer();

        const revocationKey = ChannelKeys.deriveRevocationPubKey(
            perCommitmentPoint,
            channel.ourSide.revocationBasePoint.toBuffer(),
        );

        const delayedKey = ChannelKeys.derivePubKey(
            perCommitmentPoint,
            channel.theirSide.delayedBasePoint.toBuffer(),
        );

        const remoteKey = channel.ourSide.paymentBasePoint.toBuffer();

        const localHtlcKey = ChannelKeys.derivePubKey(
            perCommitmentPoint,
            channel.theirSide.htlcBasePoint.toBuffer(),
        );

        const remoteHtlcKey = ChannelKeys.derivePubKey(
            perCommitmentPoint,
            channel.ourSide.htlcBasePoint.toBuffer(),
        );

        return TxFactory.createCommitment(
            !channel.funder,
            Number(channel.theirSide.nextCommitmentNumber.value),
            channel.openPaymentBasePoint.toBuffer(),
            channel.acceptPaymentBasePoint.toBuffer(),
            channel.fundingOutPoint,
            channel.theirSide.dustLimit,
            channel.feeRatePerKw.sats,
            channel.theirSide.toSelfDelayBlocks,
            channel.theirSide.balance,
            channel.ourSide.balance,
            revocationKey,
            delayedKey,
            remoteKey,
            true,
            localHtlcKey,
            remoteHtlcKey,
        );
    }

    /**
     * Signs the commitment transaction using the `funding_secret` that
     * was used to generate the `funding_pubkey` in either the
     * `open_channel` or `accept_channel` message.
     *
     * Note: this method is not attached to channel so that an external
     * signing method could be sued if needed.
     * @param channel
     * @param ctx
     * @returns
     */
    public async signCommitmentTx(channel: Channel, ctx: TxBuilder): Promise<Buffer> {
        const der = ctx.signSegWitv0(
            0,
            channel.fundingScript,
            channel.fundingKey,
            channel.fundingAmount,
        );
        return sigFromDER(der.subarray(0, der.length - 1));
    }

    /**
     * Once the funding node has created and signed the commitment
     * transaction it can construct the `funding_created` message to
     * send to the peer. This method constructs a `funding_created`
     * message as defined in BOLT 2.
     * @param channel
     * @param signature
     * @returns
     */
    public async createFundingCreatedMessage(
        channel: Channel,
        signature: Buffer,
    ): Promise<FundingCreatedMessage> {
        const msg = new FundingCreatedMessage();
        msg.temporaryChannelId = channel.temporaryId;
        msg.fundingTxId = channel.fundingOutPoint.txid.serialize(HashByteOrder.Internal);
        msg.fundingOutputIndex = channel.fundingOutPoint.outputIndex;
        msg.signature = signature;
        return msg;
    }

    /**
     * This method converts the channel object into a specific commitment
     * transaction for the local node.
     * @param channel
     * @returns
     */
    public async createLocalCommitmentTx(channel: Channel): Promise<[TxBuilder, Htlc[]]> {
        const perCommitmentPoint = channel.ourSide.nextCommitmentPoint.toBuffer();

        const revocationKey = ChannelKeys.deriveRevocationPubKey(
            perCommitmentPoint,
            channel.theirSide.revocationBasePoint.toBuffer(),
        );

        const delayedKey = ChannelKeys.derivePubKey(
            perCommitmentPoint,
            channel.ourSide.delayedBasePoint.toBuffer(),
        );

        const remoteKey = channel.theirSide.paymentBasePoint.toBuffer();

        const localHtlcKey = ChannelKeys.derivePubKey(
            perCommitmentPoint,
            channel.ourSide.htlcBasePoint.toBuffer(),
        );

        const remoteHtlcKey = ChannelKeys.derivePubKey(
            perCommitmentPoint,
            channel.theirSide.htlcBasePoint.toBuffer(),
        );

        return TxFactory.createCommitment(
            channel.funder,
            Number(channel.ourSide.nextCommitmentNumber.value),
            channel.openPaymentBasePoint.toBuffer(),
            channel.acceptPaymentBasePoint.toBuffer(),
            channel.fundingOutPoint,
            channel.ourSide.dustLimit,
            channel.feeRatePerKw.sats,
            channel.ourSide.toSelfDelayBlocks,
            channel.ourSide.balance,
            channel.theirSide.balance,
            revocationKey,
            delayedKey,
            remoteKey,
            false,
            localHtlcKey,
            remoteHtlcKey,
        );
    }

    /**
     * Performs ECDSA signature verification of the funding input for
     * the commitment transaction. Fails if the signature is invalid for
     * the public key or if the signature is not a low-S signature.
     * @param channel
     * @param tx
     * @param sig
     * @param pubkey
     * @returns
     */
    public async validateCommitmentSig(
        channel: Channel,
        tx: TxBuilder,
        sig: Buffer,
        pubkey: PublicKey,
    ): Promise<boolean> {
        const hash = tx.hashSegwitv0(0, channel.fundingScript, channel.fundingAmount);
        return verifySig(hash, sig, pubkey.toBuffer());
    }

    /**
     * Validate the `funding_signed` message according to the rule
     * defined in BOLT 2 which functionally comes down to validating that
     * the signature is correct for the first local commitment transaction.
     * @param channel
     * @param msg
     * @returns
     */
    public async validateFundingSignedMessage(
        channel: Channel,
        msg: FundingSignedMessage,
    ): Promise<Result<boolean, OpeningError>> {
        // construct local commitment
        const [ctx] = await this.createLocalCommitmentTx(channel);

        // validate signature
        const result = await this.validateCommitmentSig(
            channel,
            ctx,
            msg.signature,
            channel.theirSide.fundingPubKey,
        );
        if (!result) {
            return OpeningError.toResult(OpeningErrorType.InvalidCommitmentSig);
        }
    }

    /**
     * Used by the funder. This method accepts a completed funding
     * transaction as an argument. The funder's on-chain wallet will
     * known how to sign this transaction based on the used UTXOs and
     * will perform the appropriate signing and input configurations.
     * The wallet should return an immutable and broadcastable transaction.
     * @param channel
     */
    public async signFundingTx(channel: Channel): Promise<Tx> {
        return await this.wallet.signFundingTx(channel.fundingTx);
    }
}
