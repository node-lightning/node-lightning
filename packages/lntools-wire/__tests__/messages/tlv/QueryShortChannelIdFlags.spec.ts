import { expect } from "chai";
import { BitField } from "../../../lib/BitField";
import { QueryShortChannelIdsFlags } from "../../../lib/messages/tlvs/QueryShortChannelIdsFlags";
import { TlvValueReader } from "../../../lib/serialize/tlv-value-reader";

describe("QueryShortChannelIdsFlags", () => {
  describe(".serialize()", () => {
    it("raw encoded", () => {
      const sut = new QueryShortChannelIdsFlags();
      sut.flags.push(new BitField(BigInt(8)));
      sut.flags.push(new BitField(BigInt(8)));
      expect(sut.serialize(0).toString("hex")).to.equal("0103000808");
    });

    it("deflate encoded", () => {
      const sut = new QueryShortChannelIdsFlags();
      sut.flags.push(new BitField(BigInt(8)));
      sut.flags.push(new BitField(BigInt(8)));
      expect(sut.serialize(1).toString("hex")).to.equal("010b01789ce3e00000001a0011");
    });
  });

  describe(".serializeValue()", () => {
    it("raw encoded", () => {
      const sut = new QueryShortChannelIdsFlags();
      sut.flags.push(new BitField(BigInt(8)));
      sut.flags.push(new BitField(BigInt(8)));
      expect(sut.serializeValue(0).toString("hex")).to.equal("000808");
    });

    it("deflate encoded", () => {
      const sut = new QueryShortChannelIdsFlags();
      sut.flags.push(new BitField(BigInt(8)));
      sut.flags.push(new BitField(BigInt(8)));
      expect(sut.serializeValue(1).toString("hex")).to.equal("01789ce3e00000001a0011");
    });
  });

  describe(".deserialize()", () => {
    it("raw encoded", () => {
      const buf = Buffer.from("000808", "hex");
      const reader = new TlvValueReader(buf);
      const result = QueryShortChannelIdsFlags.deserialize(reader);
      expect(result.flags.length).to.equal(2);
      expect(result.flags[0].value.toString()).to.equal("8");
      expect(result.flags[1].value.toString()).to.equal("8");
    });

    it("deflate encoded", () => {
      const buf = Buffer.from("01789ce3e00000001a0011", "hex");
      const reader = new TlvValueReader(buf);
      const result = QueryShortChannelIdsFlags.deserialize(reader);
      expect(result.flags.length).to.equal(2);
      expect(result.flags[0].value.toString()).to.equal("8");
      expect(result.flags[1].value.toString()).to.equal("8");
    });
  });
});
