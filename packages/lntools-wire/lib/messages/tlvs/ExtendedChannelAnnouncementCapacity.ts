import { OutPoint } from "../../domain/outpoint";
import { TlvValueReader } from "../../serialize/tlv-value-reader";
import { TlvValueWriter } from "../../serialize/tlv-value-writer";
import { Tlv } from "./Tlv";

export class ExtendedChannelAnnouncementCapacity extends Tlv {
  public static type = BigInt(16777273);

  public static deserialize(reader: TlvValueReader): ExtendedChannelAnnouncementCapacity {
    const capacity = reader.readTUInt64();
    const instance = new ExtendedChannelAnnouncementCapacity();
    instance.capacity = capacity;
    return instance;
  }

  public type: bigint = BigInt(16777273);
  public capacity: bigint;

  public serializeValue(): Buffer {
    const writer = new TlvValueWriter();
    writer.writeTUInt64(this.capacity);
    return writer.toBuffer();
  }
}
