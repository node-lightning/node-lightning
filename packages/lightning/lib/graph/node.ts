import { BitField } from "../BitField";
import { Address } from "../domain/Address";
import { Channel } from "./channel";

/**
 * Reperesents a node in the p2p network.
 */
export class Node {
    public nodeId: Buffer;
    public lastUpdate: number;
    public alias: Buffer;
    public addresses: Address[] = [];
    public rgbColor: Buffer;
    public features: BitField;

    /**
     * Channels that the node belongs to
     */
    public channels: Map<bigint, Channel> = new Map();

    /**
     * Gets the alias as human readable string
     */
    public get aliasString(): string {
        return this.alias ? this.alias.toString("utf8").replace(/\0/g, "") : "";
    }

    /**
     * Gets the color as a an RGB color string
     */
    public get rgbColorString(): string {
        return this.rgbColor ? "#" + this.rgbColor.toString("hex") : "#000000";
    }

    /**
     * Adds a channel to the node's channel list
     */
    public linkChannel(channel: Channel) {
        const key = channel.shortChannelId.toNumber();
        this.channels.set(key, channel);
    }

    /**
     * Remove a channel from the node's channel list
     */
    public unlinkChannel(channel: Channel) {
        const key = channel.shortChannelId.toNumber();
        this.channels.delete(key);
    }
}
