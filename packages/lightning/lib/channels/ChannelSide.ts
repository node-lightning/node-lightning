import { Value, PublicKey } from "@node-lightning/bitcoin";
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

    public commitmentPoint: PublicKey;
    public nextCommitmentPoint: PublicKey;

    public commitmentNumber: CommitmentNumber = new CommitmentNumber(0n);
    public htlcCounter: number = undefined;
}
