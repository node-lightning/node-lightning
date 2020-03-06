// @ts-check

import { shortChannelIdFromString } from "@lntools/wire";
import { OutPoint } from "@lntools/wire";
import { Channel } from "../channel";
import { channelSettingsFromJson } from "./channel-settings-from-json";

/**
 * Constructs a channel from a JSON string
 */
export function channelFromJson(text: string): Channel {
  const t = JSON.parse(text);
  const c = new Channel();
  c.channelPoint = OutPoint.fromString(t.channelPoint);
  c.shortChannelId = shortChannelIdFromString(t.shortChannelId);
  c.nodeId1 = Buffer.from(t.nodeId1, "hex");
  c.nodeId2 = Buffer.from(t.nodeId2, "hex");
  c.capacity = BigInt(t.capacity);
  c.features = t.features;
  c.node1Settings = channelSettingsFromJson(t.node1Settings);
  c.node2Settings = channelSettingsFromJson(t.node2Settings);
  return c;
}
