import { Encoder } from "../../serialize/encoder";
import { TlvValueReader } from "../../serialize/tlv-value-reader";
import { TlvValueWriter } from "../../serialize/tlv-value-writer";
import { Tlv } from "./tlv";

export class ReplyChannelRangeTimestamps extends Tlv {
  public static type = BigInt(1);

  public static deserialize(reader: TlvValueReader): ReplyChannelRangeTimestamps {
    const instance = new ReplyChannelRangeTimestamps();
    const encodedBytes = reader.readBytes();
    const rawBytes = new Encoder().decode(encodedBytes);

    const reader2 = new TlvValueReader(rawBytes);
    while (!reader2.eof) {
      const ts1 = reader2.readUInt32();
      const ts2 = reader2.readUInt32();
      instance.addChannel(ts1, ts2);
    }
    return instance;
  }

  public type: bigint = BigInt(1);
  public timestamps: Array<[number, number]> = [];

  public addChannel(timestamp1: number, timestamp2: number) {
    this.timestamps.push([timestamp1, timestamp2]);
  }

  public serializeValue(encoding: number = 1): Buffer {
    const writer = new TlvValueWriter();
    for (const [ts1, ts2] of this.timestamps) {
      writer.writeUInt32(ts1);
      writer.writeUInt32(ts2);
    }

    const encoder = new Encoder();
    return encoder.encode(encoding, writer.toBuffer());
  }

  public toJSON() {
    return {
      type: this.type.toString(),
      timestamps: this.timestamps,
    };
  }
}
