import { ChannelSettings } from "../channel-settings";

/**
 * Parses ChannelSettings from JSON serialization.
 */
export function channelSettingsFromJson(text: string): ChannelSettings {
  const t = JSON.parse(text);
  const s = new ChannelSettings();
  s.timestamp = t.timestamp;
  s.htlcMinimumMsat = BigInt(t.htlcMinimumMsat);
  s.htlcMaximumMsat = t.htlcMaximumMsat ? BigInt(s.htlcMaximumMsat) : undefined;
  s.feeBaseMsat = parseInt(t.feeBaseMsat);
  s.feeProportionalMillionths = parseInt(t.feeProportionalMillionths);
  s.disabled = t.disabled;
  return s;
}
