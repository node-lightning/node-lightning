import { Value } from "@node-lightning/bitcoin";

export class ChannelPreferences {
    public maxAllowedTooSelfDelay: number = 2016;
    public maxMinimumFundingDepth: number = 144;
    public maxChanPercHtlcMinimum: number = 10;
    public minChanPercMaxHtlcInFlight: number = 1;
    public maxChanPercChannelReserve: number = 20;
    public minMaxAcceptedHtlcs: number = 1;
    public maxDustLimit: Value = Value.fromSats(1000);

    constructor(prefs: Partial<ChannelPreferences> = {}) {
        for (const key of Object.keys(prefs)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            this[key] = prefs[key];
        }
    }
}
