import {
    Network,
    OutPoint,
    PrivateKey,
    PublicKey,
    ScriptBuf,
    Tx,
    Value,
} from "@node-lightning/bitcoin";
import { ChannelId } from "../domain/ChannelId";
import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { ChannelReadyMessage } from "../messages/ChannelReadyMessage";
import { FundingSignedMessage } from "../messages/FundingSignedMessage";
import { ChannelSide } from "./ChannelSide";
import { CommitmentNumber } from "./CommitmentNumber";
import { CommitmentSecret } from "./CommitmentSecret";
import { IStateMachine } from "./IStateMachine";
import { ScriptFactory } from "./ScriptFactory";

export class Channel {
    public temporaryId: Buffer;
    public channelId: ChannelId;
    public isPublic: boolean;

    /**
     * Height of the best block chain when the channel open was initiated.
     * This value will be used by the funder to determine if they need to
     * bump the funding transaction. This value will be used by the fundee
     * to determine if they should forget the channel if 2016 blocks have
     * elapsed since the open_channel message was received.
     */
    public openBlockHeight: number;

    public minimumDepth: number;

    /**
     * Stores the entire funding transaction for use by the opener between
     * creation of the transaction and broadcasting the funding transaction.
     */
    public fundingTx: Tx;

    /**
     * OutPoint of the funding transaction
     */
    public fundingOutPoint: OutPoint;

    /**
     * Script representing the P2WSH output paying to a 2-2MS transaction
     * with the lexicographically ordered `payment_basepoint` values from
     * `open_channel` and `accept_channel`.
     */
    public fundingScript: ScriptBuf;

    public feeRatePerKw: Value;
    public fundingAmount: Value;
    public pushAmount: Value;

    private _fundingKey: PrivateKey;
    private _paymentBasePointSecret: PrivateKey;
    private _delayedBasePointSecret: PrivateKey;
    private _revocationBasePointSecret: PrivateKey;
    private _htlcBasePointSecret: PrivateKey;
    private _fundingConfirmedHeight: number;

    /**
     * The height that the funding transaction was confirmed. This height
     * plus the minimum_depth value received in accept_channel will be
     * used to calculate the readyHeight signifying the channel can
     * move to the ready state.
     */
    public get fundingConfirmedHeight(): number {
        return this._fundingConfirmedHeight;
    }

    /**
     * The block height when the channel can be considered ready. This
     * value is calculated from the fundingConfirmedHeight + minimumDepth
     * that was received in accept_channel.  Returns undefined if the
     * funding_tx has not yet been confirmed.
     */
    public get readyHeight(): number {
        if (this.fundingConfirmedHeight === undefined) return undefined;

        return this.fundingConfirmedHeight + this.minimumDepth - 1;
    }

    /**
     * Returns true when we have received the `channel_ready` message
     * from the peer. This will be evident from the peer's side of the
     * channel having a nextCommitmentNumber > 0.
     * @returns
     */
    public get hasChannelReady(): boolean {
        return this.theirSide.nextCommitmentNumber.value > 0n;
    }

    public get fundingKey(): PrivateKey {
        return this._fundingKey;
    }

    public set fundingKey(value: PrivateKey) {
        this._fundingKey = value;
        this.ourSide.fundingPubKey = value.toPubKey(true);
    }

    public get paymentBasePointSecret(): PrivateKey {
        return this._paymentBasePointSecret;
    }

    public set paymentBasePointSecret(value: PrivateKey) {
        this._paymentBasePointSecret = value;
        this.ourSide.paymentBasePoint = value.toPubKey(true);
    }

    public get delayedBasePointSecret(): PrivateKey {
        return this._delayedBasePointSecret;
    }

    public set delayedBasePointSecret(value: PrivateKey) {
        this._delayedBasePointSecret = value;
        this.ourSide.delayedBasePoint = value.toPubKey(true);
    }

    public get revocationBasePointSecret(): PrivateKey {
        return this._revocationBasePointSecret;
    }

    public set revocationBasePointSecret(value: PrivateKey) {
        this._revocationBasePointSecret = value;
        this.ourSide.revocationBasePoint = value.toPubKey(true);
    }

    public get htlcBasePointSecret(): PrivateKey {
        return this._htlcBasePointSecret;
    }

    public set htlcBasePointSecret(value: PrivateKey) {
        this._htlcBasePointSecret = value;
        this.ourSide.htlcBasePoint = value.toPubKey(true);
    }

    /**
     * Returns the payment_basepoint used in the open_channel message.
     * This getter is just sugar for checking who the funder is and
     * returning their payment_basepoint.
     */
    public get openPaymentBasePoint(): PublicKey {
        return this.funder ? this.ourSide.paymentBasePoint : this.theirSide.paymentBasePoint;
    }

    /**
     * Returns the payment_basepoint used in the accept_channel message.
     * This getter is just sugar for checking who the funder is and
     * returning their payment_basepoint.
     */
    public get acceptPaymentBasePoint(): PublicKey {
        return this.funder ? this.theirSide.paymentBasePoint : this.ourSide.paymentBasePoint;
    }

    public perCommitmentSeed: Buffer;

    public ourSide: ChannelSide;
    public theirSide: ChannelSide;

    public state: IStateMachine;

    constructor(readonly peerId: string, readonly network: Network, readonly funder: boolean) {
        this.ourSide = new ChannelSide();
        this.theirSide = new ChannelSide();
    }

    /**
     * Attaches the properties from an `accept_channel` message defined
     * in BOLT 2 to the channel instance. This method is called after an
     * `accept_channel` message has been validated.
     * @param msg
     */
    public attachAcceptChannel(msg: AcceptChannelMessage) {
        this.minimumDepth = msg.minimumDepth;
        this.ourSide.channelReserve = msg.channelReserveValue;
        this.ourSide.toSelfDelayBlocks = msg.toSelfDelay;
        this.theirSide.dustLimit = msg.dustLimitValue;
        this.theirSide.minHtlcValue = msg.htlcMinimumValue;
        this.theirSide.maxAcceptedHtlc = msg.maxAcceptedHtlcs;
        this.theirSide.maxInFlightHtlcValue = msg.maxHtlcValueInFlightValue;
        this.theirSide.fundingPubKey = new PublicKey(msg.fundingPubKey, this.network);
        this.theirSide.paymentBasePoint = new PublicKey(msg.paymentBasePoint, this.network);
        this.theirSide.delayedBasePoint = new PublicKey(msg.delayedPaymentBasePoint, this.network);
        this.theirSide.htlcBasePoint = new PublicKey(msg.htlcBasePoint, this.network);
        this.theirSide.revocationBasePoint = new PublicKey(msg.revocationBasePoint, this.network);
        this.theirSide.nextCommitmentNumber = new CommitmentNumber(0n);
        this.theirSide.nextCommitmentPoint = new PublicKey(
            msg.firstPerCommitmentPoint,
            this.network,
        );
        this.fundingScript = ScriptFactory.fundingScript(
            this.ourSide.fundingPubKey.toBuffer(),
            this.theirSide.fundingPubKey.toBuffer(),
        ).toScriptBuf();
        return this;
    }

    /**
     * Helper used by the funder to attach the funding transaction and
     * funding outpoint in one pass. This will also populate the
     * `channel_id` which will be used when the `funding_signed` message
     * is received.
     * @param tx
     */
    public attachFundingTx(tx: Tx) {
        this.fundingTx = tx;
        const fundingOutPoint = new OutPoint(tx.txId, 0);
        this.fundingOutPoint = fundingOutPoint;
        this.channelId = ChannelId.fromOutPoint(this.fundingOutPoint);
        return this;
    }

    /**
     * Adds the peers signature to the `Channel` object. This signature
     * gets captured on our side of the channel for the next commitment
     * transaction our side can use.
     * @param msg
     */
    public attachFundingSigned(msg: FundingSignedMessage) {
        this.ourSide.nextCommitmentSig = msg.signature;
        return this;
    }

    /**
     * This function is used when preparing to send `channel_ready` or
     * prior to sending the `revoke_and_ack` message to a peer. This
     * function will revoke the properties of the current commitment and
     * transition the `next_*` values into the the current, thus
     * establishing a new "next commitment".
     */
    public revokeLocalCommitment() {
        // rotate next into current
        this.ourSide.commitmentNumber = this.ourSide.nextCommitmentNumber;
        this.ourSide.commitmentPoint = this.ourSide.nextCommitmentPoint;
        this.ourSide.commitmentSig = this.ourSide.nextCommitmentSig;

        // reset next
        this.ourSide.nextCommitmentNumber = this.ourSide.commitmentNumber.next();
        this.ourSide.nextCommitmentPoint = CommitmentSecret.publicKey(
            this.perCommitmentSeed,
            this.network,
            this.ourSide.nextCommitmentNumber,
        );
        this.ourSide.nextCommitmentSig = undefined;
        return this;
    }

    /**
     * Marks the height that channel was confirmed at.
     * @param block
     */
    public markConfirmed(height: number) {
        this._fundingConfirmedHeight = height;
        return this;
    }

    /**
     * Stores the `second_per_commitment_point` received by the peer
     * onto their side of the channel and rotates the next commitment
     * information into the current position while establishing a new
     * `next` position.
     * @param msg
     */
    public attachChannelReady(msg: ChannelReadyMessage) {
        // rotate next into current
        this.theirSide.commitmentNumber = this.theirSide.nextCommitmentNumber;
        this.theirSide.commitmentPoint = this.theirSide.nextCommitmentPoint;
        this.theirSide.commitmentSig = this.theirSide.nextCommitmentSig;

        // attach next point
        this.theirSide.nextCommitmentNumber = this.theirSide.commitmentNumber.next();
        this.theirSide.nextCommitmentPoint = new PublicKey(
            msg.nextPerCommitmentPoint,
            this.network,
        );
        this.theirSide.nextCommitmentSig = undefined;
        return this;
    }

    public toJSON() {
        return {
            channelId: this.channelId?.toHex(),
            delayedBasePointSecret: this.delayedBasePointSecret?.toHex(),
            feeRatePerKw: this.feeRatePerKw?.bitcoin.toString(),
            funder: this.funder,
            fundingAmount: this.fundingAmount?.bitcoin.toString(),
            fundingConfirmedHeight: this.fundingConfirmedHeight,
            fundingKey: this.fundingKey?.toHex(),
            fundingOutPoint: this.fundingOutPoint?.toString(),
            fundingScript: this.fundingScript?.toString(),
            fundingTx: this.fundingTx?.toHex(),
            htlcBasePointSecret: this.htlcBasePointSecret?.toHex(),
            isPublic: this.isPublic,
            minimumDepth: this.minimumDepth,
            network: this.network.name,
            openBlockHeight: this.openBlockHeight,
            ourSide: this.ourSide?.toJSON(),
            paymentBasePointSecret: this.paymentBasePointSecret?.toHex(),
            peerId: this.peerId,
            perCommitmentSeed: this.perCommitmentSeed?.toString("hex"),
            pushAmount: this.pushAmount?.bitcoin.toString(),
            revocationBasePointSecret: this.revocationBasePointSecret?.toHex(),
            state: this.state?.name,
            temporaryId: this.temporaryId?.toString("hex"),
            theirSide: this.theirSide?.toJSON(),
        };
    }
}
