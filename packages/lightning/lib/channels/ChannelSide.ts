import { Value, PublicKey } from "@node-lightning/bitcoin";

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

    public commitmentCounter: number = 0;
    public htlcCounter: number = undefined;
}
