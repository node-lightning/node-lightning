export class ChannelPreferences {
    public maxAllowedTooSelfDelay: number = 2016;
    public maxMinimumFundingDepth: number = 144;

    constructor(prefs: Partial<ChannelPreferences> = {}) {
        for (const key of Object.keys(prefs)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            this[key] = prefs[key];
        }
    }
}
