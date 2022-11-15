import { ChannelAnnouncementMessage } from "../../messages/ChannelAnnouncementMessage";
import { ExtendedChannelAnnouncementMessage } from "../../messages/ExtendedChannelAnnouncementMessage";
import { Channel } from "../channel";

/**
 * Constructs an incomplete channel from a node announcement message. The channel does
 * not include outpoint, capacity, or per node settings found in channel_update
 * messages. These values need to be set elsewhere.
 */
export function channelFromMessage(
    msg: ChannelAnnouncementMessage | ExtendedChannelAnnouncementMessage,
): Channel {
    const c = new Channel();
    c.shortChannelId = msg.shortChannelId;
    c.features = msg.features;
    c.nodeId1 = msg.nodeId1;
    c.nodeId2 = msg.nodeId2;
    if ("outpoint" in msg) {
        c.channelPoint = msg.outpoint;
        c.capacity = msg.capacity;
    }
    return c;
}
