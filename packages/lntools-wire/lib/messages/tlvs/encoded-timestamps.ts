import { Checksum } from "../../domain/checksum";
import { ChannelUpdateMessage } from "../channel-update-message";

export class ChannelUpdateTimestamps {
  public static fromMessages(node1Update: ChannelUpdateMessage, node2Update: ChannelUpdateMessage) {
    const instance = new ChannelUpdateTimestamps();
    instance.node1Timestamp = node1Update ? node1Update.timestamp : 0;
    instance.node2Timestamp = node2Update ? node2Update.timestamp : 0;
    return instance;
  }

  public node1Timestamp: number;
  public node2Timestamp: number;

  public serialize(): Buffer {
    throw new Error("");
  }
}
