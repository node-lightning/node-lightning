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
}
