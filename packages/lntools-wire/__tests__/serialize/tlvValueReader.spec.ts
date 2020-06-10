import { expect } from "chai";
import { TlvValueReader } from "../../lib/serialize/tlvValueReader";

describe("TlvValueReader", () => {
  describe(".readUInt8()", () => {
    it("should read 0", () => {
      const sut = new TlvValueReader(Buffer.from("00", "hex"));
      const a = sut.readUInt8();
      expect(a).to.equal(0);
    });

    it("should read 1", () => {
      const sut = new TlvValueReader(Buffer.from("01", "hex"));
      const a = sut.readUInt8();
      expect(a).to.equal(1);
    });

    it("should read 255", () => {
      const sut = new TlvValueReader(Buffer.from("ff", "hex"));
      const a = sut.readUInt8();
      expect(a).to.equal(255);
    });

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      expect(() => sut.readUInt8()).to.throw();
    });
  });

  describe(".readUInt16()", () => {
    it("should read 0", () => {
      const sut = new TlvValueReader(Buffer.from("0000", "hex"));
      const a = sut.readUInt16();
      expect(a).to.equal(0);
    });

    it("should read 1", () => {
      const sut = new TlvValueReader(Buffer.from("0001", "hex"));
      const a = sut.readUInt16();
      expect(a).to.equal(1);
    });

    it("should read 256", () => {
      const sut = new TlvValueReader(Buffer.from("0100", "hex"));
      const a = sut.readUInt16();
      expect(a).to.equal(256);
    });

    it("should read 0xffff", () => {
      const sut = new TlvValueReader(Buffer.from("ffff", "hex"));
      const a = sut.readUInt16();
      expect(a).to.equal(65535);
    });

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      expect(() => sut.readUInt16()).to.throw();
    });
  });

  describe(".readUInt32()", () => {
    it("should read 0", () => {
      const sut = new TlvValueReader(Buffer.from("00000000", "hex"));
      const a = sut.readUInt32();
      expect(a).to.equal(0);
    });

    it("should read 0x00000001", () => {
      const sut = new TlvValueReader(Buffer.from("00000001", "hex"));
      const a = sut.readUInt32();
      expect(a).to.equal(1);
    });

    it("should read 0x00000100", () => {
      const sut = new TlvValueReader(Buffer.from("00000100", "hex"));
      const a = sut.readUInt32();
      expect(a).to.equal(256);
    });

    it("should read 0x00010000", () => {
      const sut = new TlvValueReader(Buffer.from("00010000", "hex"));
      const a = sut.readUInt32();
      expect(a).to.equal(65536);
    });

    it("should read 0x01000000", () => {
      const sut = new TlvValueReader(Buffer.from("01000000", "hex"));
      const a = sut.readUInt32();
      expect(a).to.equal(16777216);
    });

    it("should read 0xffffffff", () => {
      const sut = new TlvValueReader(Buffer.from("ffffffff", "hex"));
      const a = sut.readUInt32();
      expect(a).to.equal(4294967295);
    });

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      expect(() => sut.readUInt32()).to.throw();
    });
  });

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

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      expect(() => sut.readUInt64()).to.throw();
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

  describe(".readChanHash()", () => {
    it("should read 32-bytes", () => {
      const sut = new TlvValueReader(Buffer.alloc(32, 1));
      const a = sut.readChainHash();
      expect(a.toString("hex")).to.equal(
        "0101010101010101010101010101010101010101010101010101010101010101",
      );
    });

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      expect(() => sut.readChainHash()).to.throw();
    });
  });

  describe(".readChannelId()", () => {
    it("should read 32-bytes", () => {
      const sut = new TlvValueReader(Buffer.alloc(32, 1));
      const a = sut.readChannelId();
      expect(a.toString("hex")).to.equal(
        "0101010101010101010101010101010101010101010101010101010101010101",
      );
    });

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      expect(() => sut.readChannelId()).to.throw();
    });
  });

  describe(".readSha256()", () => {
    it("should read 32-bytes", () => {
      const sut = new TlvValueReader(Buffer.alloc(32, 1));
      const a = sut.readSha256();
      expect(a.toString("hex")).to.equal(
        "0101010101010101010101010101010101010101010101010101010101010101",
      );
    });

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      expect(() => sut.readSha256()).to.throw();
    });
  });

  describe(".readSignature()", () => {
    it("should read 64-bytes", () => {
      const sut = new TlvValueReader(Buffer.alloc(64, 1));
      const a = sut.readSignature();
      expect(a.toString("hex")).to.equal(
        "01010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101",
      );
    });

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      expect(() => sut.readSignature()).to.throw();
    });
  });

  describe(".readPoint()", () => {
    it("should read 64-bytes", () => {
      const sut = new TlvValueReader(Buffer.alloc(33, 1));
      const a = sut.readPoint();
      expect(a.toString("hex")).to.equal(
        "010101010101010101010101010101010101010101010101010101010101010101",
      );
    });

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      expect(() => sut.readPoint()).to.throw();
    });
  });

  describe(".readShortChannelId()", () => {
    it("should read 8-bytes", () => {
      const sut = new TlvValueReader(Buffer.from("0000010000020003", "hex"));
      const a = sut.readShortChannelId();
      expect(a.block).to.equal(1);
      expect(a.txIdx).to.equal(2);
      expect(a.voutIdx).to.equal(3);
    });

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.alloc(0));
      expect(() => sut.readShortChannelId()).to.throw();
    });
  });

  describe(".readBytes()", () => {
    it("should read remaining bytes", () => {
      const sut = new TlvValueReader(Buffer.from("0000010000020003", "hex"));
      const a = sut.readBytes();
      expect(a.toString("hex")).to.equal("0000010000020003");
    });

    it("should read requested bytes", () => {
      const sut = new TlvValueReader(Buffer.from("0000010000020003", "hex"));
      const a = sut.readBytes(3);
      expect(a.toString("hex")).to.equal("000001");
    });

    it("should throw range error", () => {
      const sut = new TlvValueReader(Buffer.from("0000010000020003", "hex"));
      sut.readBytes();
      expect(() => sut.readBytes(9)).to.throw();
    });
  });
});
