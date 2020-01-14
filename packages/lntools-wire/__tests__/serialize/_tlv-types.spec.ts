import { TlvValueReader } from "../../lib/serialize/tlv-value-reader";
import { TlvValueWriter } from "../../lib/serialize/tlv-value-writer";
import { ShortChannelId } from "../../lib/shortchanid";

export class N1Type1 {
  public static type: bigint = BigInt(1);
  public static deserialize(buf: Buffer): N1Type1 {
    const reader = new TlvValueReader(buf);
    const instance = new N1Type1();
    instance.amountMsat = reader.readTUInt64();
    return instance;
  }

  public amountMsat: bigint = BigInt(0);

  public serialize(): Buffer {
    const writer = new TlvValueWriter();
    writer.writeTUInt64(BigInt(this.amountMsat));
    return writer.toBuffer();
  }

  public toJson() {
    return {
      amount_msat: this.amountMsat.toString(),
    };
  }
}

// tslint:disable-next-line: max-classes-per-file
export class N1Type2 {
  public static type: bigint = BigInt(2);
  public static deserialize(buf: Buffer): N1Type2 {
    const reader = new TlvValueReader(buf);
    const instance = new N1Type2();
    instance.scid = reader.readShortChannelId();
    return instance;
  }

  public scid: ShortChannelId;

  public serialize(): Buffer {
    const writer = new TlvValueWriter();
    writer.writeShortChannelId(this.scid);
    return writer.toBuffer();
  }

  public toJson() {
    return {
      scid: this.scid.toString(),
    };
  }
}

// tslint:disable-next-line: max-classes-per-file
export class N1Type3 {
  public static type: bigint = BigInt(3);
  public static deserialize(buf: Buffer): N1Type3 {
    const reader = new TlvValueReader(buf);
    const instance = new N1Type3();
    instance.nodeId = reader.readPoint();
    instance.amountMsat1 = reader.readUInt64();
    instance.amountMsat2 = reader.readUInt64();
    return instance;
  }

  public nodeId: Buffer;
  public amountMsat1: bigint = BigInt(0);
  public amountMsat2: bigint = BigInt(0);

  public serialize(): Buffer {
    const writer = new TlvValueWriter();
    writer.writePoint(this.nodeId);
    writer.writeUInt64(this.amountMsat1);
    writer.writeUInt64(this.amountMsat2);
    return writer.toBuffer();
  }

  public toJson() {
    return {
      node_id: this.nodeId.toString("hex"),
      amount_msat_1: this.amountMsat1.toString(),
      amount_msat_2: this.amountMsat2.toString(),
    };
  }
}

// tslint:disable-next-line: max-classes-per-file
export class N1Type254 {
  public static type: bigint = BigInt(254);
  public static deserialize(buf: Buffer): N1Type254 {
    const reader = new TlvValueReader(buf);
    const instance = new N1Type254();
    instance.cltvDelta = reader.readUInt16();
    return instance;
  }

  public cltvDelta: number;

  public serialize() {
    const writer = new TlvValueWriter();
    writer.writeUInt16(this.cltvDelta);
    return writer.toBuffer();
  }

  public toJson() {
    return {
      cltv_delta: this.cltvDelta,
    };
  }
}

// tslint:disable-next-line: max-classes-per-file
export class N2Type0 {
  public static type: bigint = BigInt(1);
  public static deserialize(buf: Buffer): N2Type0 {
    const reader = new TlvValueReader(buf);
    const instance = new N2Type0();
    instance.amountMsat = reader.readTUInt64();
    return instance;
  }

  public amountMsat: bigint = BigInt(0);

  public serialize(): Buffer {
    const writer = new TlvValueWriter();
    writer.writeTUInt64(this.amountMsat);
    return writer.toBuffer();
  }

  public toJson() {
    return {
      amount_msat: this.amountMsat.toString(),
    };
  }
}

// tslint:disable-next-line: max-classes-per-file
export class N2Type11 {
  public static type: bigint = BigInt(11);
  public static deserialize(buf: Buffer): N2Type11 {
    const reader = new TlvValueReader(buf);
    const instance = new N2Type11();
    instance.cltvExpiry = reader.readTUInt32();
    return instance;
  }

  public cltvExpiry: number;

  public serialize(): Buffer {
    const writer = new TlvValueWriter();
    writer.writeTUInt32(this.cltvExpiry);
    return writer.toBuffer();
  }

  public toJson() {
    return {
      cltv_expiry: this.cltvExpiry,
    };
  }
}
