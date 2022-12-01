import { Value } from "@node-lightning/bitcoin";
import { BitField } from "../BitField";
import { InitFeatureFlags } from "../flags/InitFeatureFlags";
import { IPeer } from "../Peer";

export class OpenChannelRequest {
    public peer: IPeer;
    public ourOptions: BitField<InitFeatureFlags>;
    public fundingAmount: Value;
    public pushAmount: Value;
    public maxHtlcInFlightValue: Value;
    public minHtlcValue: Value;
    public maxAcceptedHtlcs: number;
    public channelReserveValue: Value;
    public toSelfBlockDelay: number;
    public publicChannel: boolean = true;
}
