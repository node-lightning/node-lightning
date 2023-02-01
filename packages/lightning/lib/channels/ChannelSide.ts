import { Value, PublicKey, EcdsaSig } from "@node-lightning/bitcoin";
import { CommitmentNumber } from "./CommitmentNumber";

export class ChannelSide {
    public dustLimit: Value;
    public channelReserve: Value;
    public toSelfDelayBlocks: number;
    public maxAcceptedHtlc: number;
    public maxInFlightHtlcValue: Value;
    public minHtlcValue: Value;
    public fundingPubKey: PublicKey;
    public paymentBasePoint: PublicKey;
    public delayedBasePoint: PublicKey;
    public revocationBasePoint: PublicKey;
    public htlcBasePoint: PublicKey;

    public commitmentNumber: CommitmentNumber;
    public commitmentPoint: PublicKey;
    public commitmentSig: EcdsaSig;

    public nextCommitmentNumber: CommitmentNumber;
    public nextCommitmentPoint: PublicKey;
    public nextCommitmentSig: EcdsaSig | undefined;

    public balance: Value;
    public htlcCounter: number = undefined;

    public toJSON() {
        return {
            balance: this.balance?.bitcoin?.toString(),
            channelReserve: this.channelReserve?.bitcoin.toString(),
            commitmentNumber: this.commitmentNumber?.value.toString(),
            commitmentPoint: this.commitmentPoint?.toHex(),
            commitmentSig: this.commitmentSig?.toHex(),
            delayedBasePoint: this.delayedBasePoint?.toHex(),
            dustLimit: this.dustLimit?.bitcoin.toString(),
            fundingPubKey: this.fundingPubKey?.toHex(),
            htlcBasePoint: this.htlcBasePoint?.toHex(),
            htlcCounter: this.htlcCounter,
            maxAcceptedHtlc: this.maxAcceptedHtlc,
            maxInFlightHtlcValue: this.maxInFlightHtlcValue?.bitcoin.toString(),
            minHtlcValue: this.minHtlcValue?.bitcoin.toString(),
            nextCommitmentNumber: this.nextCommitmentNumber?.value.toString(),
            nextCommitmentPoint: this.nextCommitmentPoint?.toHex(),
            nextCommitmentSig: this.nextCommitmentSig?.toHex(),
            paymentBasePoint: this.paymentBasePoint?.toHex(),
            revocationBasePoint: this.revocationBasePoint?.toHex(),
            toSelfDelayBlocks: this.toSelfDelayBlocks,
        };
    }
}
