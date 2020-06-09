import { Checksum } from "../../domain/checksum";
import { ChannelUpdateMessage } from "../ChannelUpdateMessage";

export class ChannelUpdateChecksums {
  public static fromMessages(node1Update: ChannelUpdateMessage, node2Update: ChannelUpdateMessage) {
    const instance = new ChannelUpdateChecksums();
    instance.node1Checksum = node1Update ? node1Update.checksum() : Checksum.empty();
    instance.node2Checksum = node2Update ? node2Update.checksum() : Checksum.empty();
    return instance;
  }

  public node1Checksum: Checksum;
  public node2Checksum: Checksum;

  public serialize(): Buffer {
    throw new Error("");
  }
}
