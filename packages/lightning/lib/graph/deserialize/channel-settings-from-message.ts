import { ChannelUpdateMessage } from "../../messages/ChannelUpdateMessage";
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
    instance.htlcMinimumMsat = msg.htlcMinimumMsat ? msg.htlcMinimumMsat.msats : undefined;
    instance.htlcMaximumMsat = msg.htlcMaximumMsat ? msg.htlcMaximumMsat.msats : undefined;
    instance.feeBaseMsat = msg.feeBaseMsat ? Number(msg.feeBaseMsat.msats) : undefined;
    instance.feeProportionalMillionths = msg.feeProportionalMillionths
        ? Number(msg.feeProportionalMillionths.microsats)
        : null;
    instance.disabled = msg.disabled;
    return instance;
}
