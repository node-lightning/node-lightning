import { TlvValueReader } from "../../serialize/tlv-value-reader";
import { TlvValueWriter } from "../../serialize/tlv-value-writer";
import { ZlibEncoder } from "../../serialize/zlib-encoder";
import { Tlv } from "./tlv";

export class ReplyChannelRangeTimestamps extends Tlv {
  public static type = BigInt(1);

  public static deserialize(reader: TlvValueReader): ReplyChannelRangeTimestamps {
    const instance = new ReplyChannelRangeTimestamps();
    const encodingType = reader.readUInt8();
    const rawBytes = reader.readBytes(reader.size - reader.position);

    let decoded: Buffer;
    switch (encodingType) {
      case 0x0:
        decoded = rawBytes;
        break;
      case 0x1:
        decoded = new ZlibEncoder().decode(rawBytes);
        break;
    }
    const reader2 = new TlvValueReader(decoded);

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
    writer.writeUInt8(encoding);

    const writer2 = new TlvValueWriter();
    for (const [ts1, ts2] of this.timestamps) {
      writer2.writeUInt32(ts1);
      writer2.writeUInt32(ts2);
    }

    switch (encoding) {
      case 0x0:
        writer.writeBytes(writer2.toBuffer());
        break;
      case 0x1: {
        const encoded = new ZlibEncoder().encode(writer2.toBuffer());
        writer.writeBytes(encoded);
        break;
      }
    }

    return writer.toBuffer();
  }
}
