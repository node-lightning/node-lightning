import { Network, PrivateKey, Value } from "@node-lightning/bitcoin";
import { ChannelId } from "../domain/ChannelId";
import { ChannelSide } from "./ChannelSide";

export class Channel {
    public peerId: string;
    public temporaryId: Buffer;
    public channelId: ChannelId;

    public feeRatePerKw: Value;
    public fundingAmount: Value;
    public pushAmount: Value;

    public fundingKey: PrivateKey;
    public paymentBasePointSecret: PrivateKey;
    public delayedBasePointSecret: PrivateKey;
    public revocationBasePointSecret: PrivateKey;
    public htlcBasePointSecret: PrivateKey;
    public perCommitmentSeed: PrivateKey;

    public ourSide: ChannelSide;
    public theirSide: ChannelSide;

    // public state: StateMachine;

    constructor(readonly network: Network, readonly funder: boolean) {
        this.ourSide = new ChannelSide();
        this.theirSide = new ChannelSide();
    }
}
