import { BitField } from "@node-lightning/core";
import { ShortChannelId } from "@node-lightning/core";
import { OutPoint } from "@node-lightning/wire";
import { ChannelSettings } from "./channel-settings";

export class Channel {
    /**
     * Short channel identifier for the channel that points to the funding
     * transaction on the blockchain.
     */
    public shortChannelId: ShortChannelId;

    /**
     * Obtained after verifying the transaction is a valid
     * channel funding transaction and is still a UTXO
     */
    public channelPoint: OutPoint;

    /**
     * Public key of the first node, as ordered by DER encoding of the
     * 33-byte secp256k1 public key.
     */
    public nodeId1: Buffer;

    /**
     * Public key of the second node, as ordered by DER encoding of the
     * 33-byte secp256k1 public key.
     */
    public nodeId2: Buffer;

    /**
     * Channel features
     */
    public features: BitField;

    /**
     * Routing policy for the first node
     */
    public node1Settings: ChannelSettings;

    /**
     * Routing policy for the second node
     */
    public node2Settings: ChannelSettings;

    /**
     * Capacity of the channel as determined by the funding transaction
     * output amount.
     */
    public capacity: bigint;

    /**
     * Gets the most recently updated timestamp based on the settings
     * from the two nodes
     */
    public get lastUpdate(): number {
        const t1 = (this.node1Settings && this.node1Settings.timestamp) || 0;
        const t2 = (this.node2Settings && this.node2Settings.timestamp) || 0;
        return Math.max(t1, t2);
    }

    /**
     * Routable when nodes are known and validated and at least one
     * node has broadcast its relay fees
     */
    get isRoutable(): boolean {
        return !!this.nodeId1 && !!this.nodeId2 && !!(this.node1Settings || this.node2Settings);
    }

    /**
     * Update channel settings
     */
    public updateSettings(settings: ChannelSettings): boolean {
        if (settings.direction === 0) {
            if (this.node1Settings && this.node1Settings.timestamp > settings.timestamp) {
                return false;
            }
            this.node1Settings = settings;
            return true;
        } else {
            if (this.node2Settings && this.node2Settings.timestamp > settings.timestamp) {
                return false;
            }
            this.node2Settings = settings;
            return true;
        }
    }
}
