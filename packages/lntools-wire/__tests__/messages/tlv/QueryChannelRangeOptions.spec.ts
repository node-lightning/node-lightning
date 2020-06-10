import { expect } from "chai";
import { QueryChannelRangeOptions } from "../../../lib/messages/tlvs/QueryChannelRangeOptions";
import { TlvValueReader } from "../../../lib/serialize/TlvValueReader";

describe("QueryChannelRangeOptions", () => {
  describe("no initial options", () => {
    it("timestamp should be disabled", () => {
      const sut = new QueryChannelRangeOptions();
      expect(sut.timestamp).to.equal(false);
    });

    it("checksum should be disabled", () => {
      const sut = new QueryChannelRangeOptions();
      expect(sut.checksum).to.equal(false);
    });
  });

  describe("initial options", () => {
    it("timestamp should be enabled", () => {
      const sut = new QueryChannelRangeOptions(BigInt(3));
      expect(sut.timestamp).to.equal(true);
    });

    it("checksum should be enabled", () => {
      const sut = new QueryChannelRangeOptions(BigInt(3));
      expect(sut.checksum).to.equal(true);
    });
  });

  describe("set timestamp", () => {
    it("should set the timestamp to true", () => {
      const sut = new QueryChannelRangeOptions();
      sut.timestamp = true;
      expect(sut.timestamp).to.equal(true);
    });

    it("should unset the timestamp", () => {
      const sut = new QueryChannelRangeOptions(BigInt(3));
      sut.timestamp = false;
      expect(sut.timestamp).to.equal(false);
    });
  });

  describe("set checksum", () => {
    it("should set the checksum to true", () => {
      const sut = new QueryChannelRangeOptions();
      sut.checksum = true;
      expect(sut.checksum).to.equal(true);
    });

    it("should unset the checksum to false", () => {
      const sut = new QueryChannelRangeOptions(BigInt(3));
      sut.checksum = false;
      expect(sut.checksum).to.equal(false);
    });
  });

  describe(".serializeValue()", () => {
    it("should serialize", () => {
      const sut = new QueryChannelRangeOptions(BigInt(3));
      expect(sut.serializeValue().toString("hex")).to.equal("03");
    });
  });

  describe(".serialize()", () => {
    const sut = new QueryChannelRangeOptions(BigInt(3));
    expect(sut.serialize().toString("hex")).to.equal("010103");
  });

  describe(".deserialize()", () => {
    it("should deserialize", () => {
      const reader = new TlvValueReader(Buffer.from("03", "hex"));
      const sut = QueryChannelRangeOptions.deserialize(reader);
      expect(sut.options.value.toString(16)).to.equal("3");
    });
  });
});
