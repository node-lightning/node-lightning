import { BitField } from "../../BitField";
import { QueryScidFlags } from "../../flags/QueryScidFlags";
import { Encoder } from "../../serialize/Encoder";
import { EncodingType } from "../../serialize/EncodingType";
import { TlvValueReader } from "../../serialize/TlvValueReader";
import { TlvValueWriter } from "../../serialize/TlvValueWriter";
import { Tlv } from "./Tlv";

export class QueryShortChannelIdsFlags extends Tlv {
  public static type = BigInt(1);

  public static deserialize(reader: TlvValueReader): QueryShortChannelIdsFlags {
    const instance = new QueryShortChannelIdsFlags();
    const encodedBytes = reader.readBytes();
    const rawBytes = new Encoder().decode(encodedBytes);

    const reader2 = new TlvValueReader(rawBytes);
    while (!reader2.eof) {
      const rawFlags = reader2.readBigSize();
      const flags = new BitField(rawFlags);
      instance.flags.push(flags);
    }
    return instance;
  }

  public type: bigint = BigInt(1);
  public flags: Array<BitField<QueryScidFlags>> = [];

  public addFlags(...flags: Array<BitField<QueryScidFlags>>) {
    this.flags.push(...flags);
    return this;
  }

  public serializeValue(encoding: number = EncodingType.ZlibDeflate): Buffer {
    const writer = new TlvValueWriter();
    for (const flags of this.flags) {
      writer.writeBigSize(flags.value);
    }

    const encoder = new Encoder();
    return encoder.encode(encoding, writer.toBuffer());
  }

  public toJSON() {
    return {
      type: this.type.toString(),
      flags: this.flags.map(p => p.toNumber()),
    };
  }
}
