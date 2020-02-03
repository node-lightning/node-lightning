import { expect } from "chai";
import { TlvValueReader } from "../../lib/serialize/tlv-value-reader";

describe("TlvValueReader", () => {
  describe(".readUInt64()", () => {
    it("should read 1", () => {
      const sut = new TlvValueReader(Buffer.from("0000000000000001", "hex"));
      const a = sut.readUInt64();
      expect(a).to.equal(BigInt(1));
    });
    it("should read 0x1000000000000000 (1152921504606846976)", () => {
      const sut = new TlvValueReader(Buffer.from("1000000000000000", "hex"));
      const a = sut.readUInt64();
      expect(a).to.equal(BigInt("0x1000000000000000"));
    });
  });

  describe(".readTUInt16()", () => {
    it("should read 0-byte", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      const a = sut.readTUInt32();
      expect(a).to.equal(0);
    });

    it("should read 1-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1]));
      const a = sut.readTUInt32();
      expect(a).to.equal(1);
    });

    it("should read 2-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 1]));
      const a = sut.readTUInt32();
      expect(a).to.equal(257);
    });
  });

  describe(".readTUInt32()", () => {
    it("should read 0-byte", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      const a = sut.readTUInt32();
      expect(a).to.equal(0);
    });

    it("should read 1-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1]));
      const a = sut.readTUInt32();
      expect(a).to.equal(1);
    });

    it("should read 2-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 1]));
      const a = sut.readTUInt32();
      expect(a).to.equal(257);
    });

    it("should read 3-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 0, 0]));
      const a = sut.readTUInt32();
      expect(a).to.equal(0x010000);
    });

    it("should read 4-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 0, 0, 0]));
      const a = sut.readTUInt32();
      expect(a).to.equal(0x01000000);
    });
  });

  describe(".readTUInt64()", () => {
    it("should read 0-byte", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      const a = sut.readTUInt64();
      expect(a).to.equal(BigInt(0));
    });

    it("should read 1-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1]));
      const a = sut.readTUInt64();
      expect(a).to.equal(BigInt(1));
    });

    it("should read 2-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 1]));
      const a = sut.readTUInt64();
      expect(a).to.equal(BigInt(257));
    });

    it("should read 3-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 0, 0]));
      const a = sut.readTUInt64();
      expect(a).to.equal(BigInt("0x010000"));
    });

    it("should read 4-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 0, 0, 0]));
      const a = sut.readTUInt64();
      expect(a).to.equal(BigInt("0x01000000"));
    });

    it("should read 5-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 0, 0, 0, 0]));
      const a = sut.readTUInt64();
      expect(a).to.equal(BigInt("0x0100000000"));
    });

    it("should read 6-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 0, 0, 0, 0, 0]));
      const a = sut.readTUInt64();
      expect(a).to.equal(BigInt("0x010000000000"));
    });

    it("should read 7-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 0, 0, 0, 0, 0, 0]));
      const a = sut.readTUInt64();
      expect(a).to.equal(BigInt("0x01000000000000"));
    });

    it("should read 8-byte", () => {
      const sut = new TlvValueReader(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]));
      const a = sut.readTUInt64();
      expect(a).to.equal(BigInt("0x0100000000000000"));
    });

    it("should read max", () => {
      const sut = new TlvValueReader(Buffer.from([255, 255, 255, 255, 255, 255, 255, 255]));
      const a = sut.readTUInt64();
      expect(a).to.equal(BigInt("0xffffffffffffffff"));
    });
  });

  describe(".readBigSize()", () => {
    it("should read 0x0", () => {
      const sut = new TlvValueReader(Buffer.from("00", "hex"));
      const a = sut.readBigSize();
      expect(a.toString(16)).to.equal("0");
    });

    it("should read below 0xfd", () => {
      const sut = new TlvValueReader(Buffer.from("fc", "hex"));
      const a = sut.readBigSize();
      expect(a.toString(16)).to.equal("fc");
    });

    it("should read 0xfd00fd", () => {
      const sut = new TlvValueReader(Buffer.from("fd00fd", "hex"));
      const a = sut.readBigSize();
      expect(a.toString(16)).to.equal("fd");
    });

    it("should read below 0x10000", () => {
      const sut = new TlvValueReader(Buffer.from("fd1000", "hex"));
      const a = sut.readBigSize();
      expect(a.toString(16)).to.equal("1000");
    });

    it("should read 0x10000", () => {
      const sut = new TlvValueReader(Buffer.from("fe00010000", "hex"));
      const a = sut.readBigSize();
      expect(a.toString(16)).to.equal("10000");
    });

    it("should read below 0x100000000 value", () => {
      const sut = new TlvValueReader(Buffer.from("feffffffff", "hex"));
      const a = sut.readBigSize();
      expect(a.toString(16)).to.equal("ffffffff");
    });

    it("should read 0x100000000 value", () => {
      const sut = new TlvValueReader(Buffer.from("ff0000000100000000", "hex"));
      const a = sut.readBigSize();
      expect(a.toString(16)).to.equal("100000000");
    });

    it("should read max value", () => {
      const sut = new TlvValueReader(Buffer.from("ffffffffffffffffff", "hex"));
      const a = sut.readBigSize();
      expect(a.toString(16)).to.equal("ffffffffffffffff");
    });
  });
});
