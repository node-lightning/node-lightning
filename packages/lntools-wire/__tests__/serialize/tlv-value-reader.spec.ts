import { expect } from "chai";
import { TlvValueReader } from "../../lib/serialize/tlv-value-reader";

describe("TlvValueReader", () => {
  describe("readBigSize", () => {
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
