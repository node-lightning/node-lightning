import { ChannelUpdateMessage } from "@node-lightning/wire";
import { ChannelSettings } from "../channel-settings";

/**
 * Creates channels settings from an update message
 * @param msg
 */
export function channelSettingsFromMessage(msg: ChannelUpdateMessage): ChannelSettings {
    const instance = new ChannelSettings();
    instance.direction = msg.direction;
    instance.timestamp = msg.timestamp;
    instance.cltvExpiryDelta = msg.cltvExpiryDelta;
    instance.htlcMinimumMsat = null;
    instance.htlcMaximumMsat = null;
    instance.feeBaseMsat = null;
    instance.feeProportionalMillionths = null;
    instance.disabled = msg.disabled;
    return instance;
}
