import { expect } from "chai";
import { QueryChannelRangeOptions } from "../../../lib/messages/tlvs/query-channel-range-options";
import { TlvValueReader } from "../../../lib/serialize/tlv-value-reader";

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

  describe(".enableTimestamp()", () => {
    it("should set the timestamp to true", () => {
      const sut = new QueryChannelRangeOptions();
      sut.enableTimestamp();
      expect(sut.timestamp).to.equal(true);
    });

    it("should return the instance", () => {
      const sut = new QueryChannelRangeOptions();
      expect(sut.enableTimestamp()).to.equal(sut);
    });
  });

  describe(".disableTimestamp()", () => {
    it("should set the timestamp to true", () => {
      const sut = new QueryChannelRangeOptions(BigInt(3));
      sut.disableTimestamp();
      expect(sut.timestamp).to.equal(false);
    });

    it("should return the instance", () => {
      const sut = new QueryChannelRangeOptions();
      expect(sut.disableTimestamp()).to.equal(sut);
    });
  });

  describe(".enableChecksum()", () => {
    it("should set the checksum to true", () => {
      const sut = new QueryChannelRangeOptions();
      sut.enableChecksum();
      expect(sut.checksum).to.equal(true);
    });

    it("should return the instance", () => {
      const sut = new QueryChannelRangeOptions();
      expect(sut.enableChecksum()).to.equal(sut);
    });
  });

  describe(".disableChecksum()", () => {
    it("should set the timestamp to false", () => {
      const sut = new QueryChannelRangeOptions(BigInt(3));
      sut.disableChecksum();
      expect(sut.checksum).to.equal(false);
    });

    it("should return the instance", () => {
      const sut = new QueryChannelRangeOptions();
      expect(sut.disableChecksum()).to.equal(sut);
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
      expect(sut.options.toString(16)).to.equal("3");
    });
  });
});
