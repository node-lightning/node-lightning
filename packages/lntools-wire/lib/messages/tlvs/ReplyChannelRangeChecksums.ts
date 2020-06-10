import { Encoder } from "../../serialize/Encoder";
import { TlvValueReader } from "../../serialize/TlvValueReader";
import { TlvValueWriter } from "../../serialize/TlvValueWriter";
import { Tlv } from "./Tlv";

export class ReplyChannelRangeChecksums extends Tlv {
  public static type = BigInt(3);

  public static deserialize(reader: TlvValueReader): ReplyChannelRangeChecksums {
    const instance = new ReplyChannelRangeChecksums();
    while (!reader.eof) {
      const c1 = reader.readUInt32();
      const c2 = reader.readUInt32();
      instance.checksums.push([c1, c2]);
    }
    return instance;
  }

  public type: bigint = BigInt(3);
  public checksums: Array<[number, number]> = [];

  public serializeValue(): Buffer {
    const writer = new TlvValueWriter();
    for (const [c1, c2] of this.checksums) {
      writer.writeUInt32(c1);
      writer.writeUInt32(c2);
    }
    return writer.toBuffer();
  }

  public toJSON() {
    return {
      type: this.type.toString(),
      checksums: this.checksums,
    };
  }
}
