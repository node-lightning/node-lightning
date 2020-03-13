import { ChannelAnnouncementMessage } from "@lntools/wire";
import { ExtendedChannelAnnouncementMessage } from "@lntools/wire";
import { Channel } from "../channel";

/**
 * Constructs an incomplete channel from a node announcement message. The channel does
 * not include outpoint, capacity, or per node settings found in channel_update
 * messages. These values need to be set elsewhere.
 */
export function channelFromMessage(msg: ChannelAnnouncementMessage): Channel {
  const c = new Channel();
  c.shortChannelId = msg.shortChannelId;
  c.features = msg.features;
  c.nodeId1 = msg.nodeId1;
  c.nodeId2 = msg.nodeId2;
  if (msg instanceof ExtendedChannelAnnouncementMessage) {
    c.channelPoint = msg.outpoint;
    c.capacity = msg.capacity;
  }
  return c;
}
