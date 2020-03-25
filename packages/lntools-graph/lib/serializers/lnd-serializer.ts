import { Address, Bitmask } from "@lntools/wire";
import { Channel } from "../channel";
import { ChannelSettings } from "../channel-settings";
import { Graph } from "../graph";
import { Node } from "../node";

/**
 * Performs JSON serialization of the graph in the same format
 * as used by LND and defined in LND API documentation:
 *
 * https://api.lightning.community/#simple-rpc-33
 */
export class LndSerializer {
  public toObject(g: Graph) {
    return {
      nodes: Array.from(g.nodes.values()).map(node => this.serializeNode(node)),
      edges: Array.from(g.channels.values()).map(chan => this.serializeChannel(chan)),
    };
  }

  public toJSON(g: Graph, format: boolean = true) {
    const obj = this.toObject(g);
    return format ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  }

  public serializeNode(node: Node) {
    return {
      last_update: node.lastUpdate,
      pub_key: node.nodeId.toString("hex"),
      alias: node.aliasString,
      addresses: node.addresses.map(address => this.serializeAddress(address)),
      color: node.rgbColorString,
    };
  }

  public serializeAddress(address: Address) {
    return {
      network: "tcp",
      addr: address.toString(),
    };
  }

  public serializeChannel(chan: Channel) {
    return {
      channel_id: chan.shortChannelId.toNumber().toString(),
      chan_point: chan.channelPoint.toString(),
      last_update: chan.lastUpdate,
      node1_pub: chan.nodeId1.toString("hex"),
      node2_pub: chan.nodeId2.toString("hex"),
      capacity: chan.capacity.toString(),
      node1_policy: this.serializeRoutingPolicy(chan.node1Settings),
      node2_policy: this.serializeRoutingPolicy(chan.node2Settings),
    };
  }

  public serializeRoutingPolicy(policy: ChannelSettings) {
    if (!policy) return null;
    return {
      time_lock_delta: policy.cltvExpiryDelta,
      min_htlc: policy.htlcMinimumMsat.toString(),
      fee_base_msat: policy.feeBaseMsat.toString(),
      fee_rate_milli_msat: policy.feeProportionalMillionths.toString(),
      disabled: policy.disabled,
      max_htlc_msat: policy.htlcMaximumMsat === undefined ? "0" : policy.htlcMaximumMsat.toString(),
      last_update: policy.timestamp,
    };
  }
}
