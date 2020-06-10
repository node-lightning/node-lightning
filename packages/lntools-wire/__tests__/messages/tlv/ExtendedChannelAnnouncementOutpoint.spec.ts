import { expect } from "chai";
import { OutPoint } from "../../../lib/domain/outpoint";
import { ExtendedChannelAnnouncementOutpoint } from "../../../lib/messages/tlvs/ExtendedChannelAnnouncementOutpoint";
import { TlvValueReader } from "../../../lib/serialize/TlvValueReader";

describe("ExtendedChannelAnnouncementOutpoint", () => {
  describe(".serializeValue()", () => {
    it("should create buffer", () => {
      const sut = new ExtendedChannelAnnouncementOutpoint();
      sut.outpoint = new OutPoint("7777777766666666555555554444444433333333222222221111111100000000", 12); // prettier-ignore
      const actual = sut.serializeValue();
      expect(actual.toString("hex")).to.equal(
        "77777777666666665555555544444444333333332222222211111111000000000c",
      );
    });
  });

  describe(".serialize()", () => {
    it("should create full TLV buffer", () => {
      const sut = new ExtendedChannelAnnouncementOutpoint();
      sut.outpoint = new OutPoint("7777777766666666555555554444444433333333222222221111111100000000", 12); // prettier-ignore
      const actual = sut.serialize();
      expect(actual.toString("hex")).to.equal(
        "fe01000037" + // type (16777271)
        "21" + // length (33)
        "77777777666666665555555544444444333333332222222211111111000000000c", // value
      ); // prettier-ignore
    });
  });

  describe(".deserialize", () => {
    it("should create instance", () => {
      const payload = Buffer.from(
        "77777777666666665555555544444444333333332222222211111111000000000c",
        "hex",
      );
      const reader = new TlvValueReader(payload);
      const actual = ExtendedChannelAnnouncementOutpoint.deserialize(reader);
      expect(actual.outpoint.txId).to.equal("7777777766666666555555554444444433333333222222221111111100000000"); // prettier-ignore
      expect(actual.outpoint.voutIdx).to.equal(12);
    });
  });
});
