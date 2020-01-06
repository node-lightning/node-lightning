import { Address } from "@lntools/wire";
import BN = require("bn.js");
import { Channel } from "./channel";

/**
 * Reperesents a node in the p2p network.
 */
export class Node {
  public nodeId: Buffer;
  public lastUpdate: number;
  public alias: Buffer;
  public addresses: Address[];
  public rgbColor: Buffer;
  public nodeSignature: Buffer;
  public features: BN;

  /**
   * Channels that the node belongs to
   */
  public channels: Map<string, Channel> = new Map();

  /**
   * Gets the alias as human readable string
   */
  get aliasString(): string {
    return this.alias ? this.alias.toString("utf8").replace(/\0/g, "") : "";
  }

  /**
   * Gets the color as a an RGB color string
   */
  get rgbColorString(): string {
    return this.rgbColor ? "#" + this.rgbColor.toString("hex") : "";
  }

  /**
   * Adds a channel to the node's channel list
   */
  public linkChannel(channel: Channel) {
    const key = channel.shortChannelId.toString();
    this.channels.set(key, channel);
  }

  /**
   * Remove a channel from the node's channel list
   */
  public unlinkChannel(channel: Channel) {
    const key = channel.shortChannelId.toString();
    this.channels.delete(key);
  }

  /**
   * Customize JSON output by converting buffers to HEX
   */
  public toJSON() {
    return {
      nodeId: this.nodeId.toString("hex"),
      lastUpdate: this.lastUpdate,
      alias: this.aliasString,
      addresses: this.addresses,
      rgbColor: this.rgbColorString,
      nodeSignature: this.nodeSignature,
    };
  }
}
