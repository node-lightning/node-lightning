import {
    Network,
    OutPoint,
    PrivateKey,
    PublicKey,
    Script,
    Tx,
    Value,
} from "@node-lightning/bitcoin";
import { ChannelId } from "../domain/ChannelId";
import { AcceptChannelMessage } from "../messages/AcceptChannelMessage";
import { ChannelSide } from "./ChannelSide";
import { CommitmentNumber } from "./CommitmentNumber";
import { IStateMachine } from "./IStateMachine";

export class Channel {
    public temporaryId: Buffer;
    public channelId: ChannelId;
    public isPublic: boolean;

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
    public fundingScript: Script;

    public feeRatePerKw: Value;
    public fundingAmount: Value;
    public pushAmount: Value;

    private _fundingKey: PrivateKey;
    private _paymentBasePointSecret: PrivateKey;
    private _delayedBasePointSecret: PrivateKey;
    private _revocationBasePointSecret: PrivateKey;
    private _htlcBasePointSecret: PrivateKey;

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
     * Modifies the channel object with state from the `accept_channel_message`.
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
        this.fundingScript = tx.outputs[0].scriptPubKey;
        this.channelId = ChannelId.fromOutPoint(this.fundingOutPoint);
        return this;
    }
}
