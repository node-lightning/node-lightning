import { Network, PrivateKey, Value } from "@node-lightning/bitcoin";
import { ChannelId } from "../domain/ChannelId";
import { ChannelSide } from "./ChannelSide";

export class Channel {
    public temporaryId: Buffer;
    public channelId: ChannelId;
    public isPublic: boolean;

    public feeRatePerKw: Value;
    public fundingAmount: Value;
    public pushAmount: Value;

    public fundingKey: PrivateKey;
    public paymentBasePointSecret: PrivateKey;
    public delayedBasePointSecret: PrivateKey;
    public revocationBasePointSecret: PrivateKey;
    public htlcBasePointSecret: PrivateKey;
    public perCommitmentSeed: Buffer;

    public ourSide: ChannelSide;
    public theirSide: ChannelSide;

    // public state: StateMachine;

    constructor(readonly peerId: string, readonly network: Network, readonly funder: boolean) {
        this.ourSide = new ChannelSide();
        this.theirSide = new ChannelSide();
    }
}
