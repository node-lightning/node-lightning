import BN = require("bn.js");
import { expect } from "chai";
import { TlvValueWriter } from "../../lib/serialize/tlv-value-writer";
import { ShortChannelId } from "../../lib/shortchanid";

describe("TlvValueWriter", () => {
  describe(".writeUInt8()", () => {
    it("should write value", () => {
      const sut = new TlvValueWriter();
      sut.writeUInt8(255);
      const buffer = sut.toBuffer();
      expect(buffer.length).to.equal(1);
      expect(buffer[0]).to.equal(255);
    });
  });

  describe(".writeUInt16()", () => {
    it("should write value", () => {
      const sut = new TlvValueWriter();
      sut.writeUInt16(4098);
      const buffer = sut.toBuffer();
      expect(buffer[0]).to.equal(0x10);
      expect(buffer[1]).to.equal(0x02);
      expect(buffer.length).to.equal(2);
    });
  });

  describe(".writeUInt32()", () => {
    it("should write value", () => {
      const sut = new TlvValueWriter();
      sut.writeUInt32(23833211);
      const buffer = sut.toBuffer();
      expect(buffer[0]).to.equal(0x01);
      expect(buffer[1]).to.equal(0x6b);
      expect(buffer[2]).to.equal(0xaa);
      expect(buffer[3]).to.equal(0x7b);
      expect(buffer.length).to.equal(4);
    });
  });

  describe(".writeUInt64()", () => {
    it("should write value", () => {
      const sut = new TlvValueWriter();
      sut.writeUInt64(new BN("23000000008123"));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("000014eb1ad48fbb");
      expect(buffer.length).to.equal(8);
    });
  });

  describe(".writeTUInt16()", () => {
    it("should write 0-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt16(0);
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("");
      expect(buffer.length).to.equal(0);
    });

    it("should write 1-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt16(255);
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ff");
      expect(buffer.length).to.equal(1);
    });

    it("should write 2-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt16(256);
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("0100");
      expect(buffer.length).to.equal(2);
    });
  });

  describe(".writeTUInt32()", () => {
    it("should write 0-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt32(0);
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("");
      expect(buffer.length).to.equal(0);
    });

    it("should write 1-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt32(255);
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ff");
      expect(buffer.length).to.equal(1);
    });

    it("should write 2-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt32(256);
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("0100");
      expect(buffer.length).to.equal(2);
    });

    it("should write 3-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt32(0xffffff);
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ffffff");
      expect(buffer.length).to.equal(3);
    });

    it("should write 4-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt32(0xffffffff);
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ffffffff");
      expect(buffer.length).to.equal(4);
    });
  });

  describe(".writeTUInt64()", () => {
    it("should write 0-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt64(new BN("00", "hex"));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("");
      expect(buffer.length).to.equal(0);
    });

    it("should write 1-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt64(new BN("ff", "hex"));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ff");
      expect(buffer.length).to.equal(1);
    });

    it("should write 2-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt64(new BN("ffff", "hex"));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ffff");
      expect(buffer.length).to.equal(2);
    });

    it("should write 3-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt64(new BN("ffffff", "hex"));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ffffff");
      expect(buffer.length).to.equal(3);
    });

    it("should write 4-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt64(new BN("ffffffff", "hex"));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ffffffff");
      expect(buffer.length).to.equal(4);
    });

    it("should write 5-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt64(new BN("ffffffffff", "hex"));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ffffffffff");
      expect(buffer.length).to.equal(5);
    });

    it("should write 6-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt64(new BN("ffffffffffff", "hex"));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ffffffffffff");
      expect(buffer.length).to.equal(6);
    });

    it("should write 7-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt64(new BN("ffffffffffffff", "hex"));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ffffffffffffff");
      expect(buffer.length).to.equal(7);
    });

    it("should write 8-byte value", () => {
      const sut = new TlvValueWriter();
      sut.writeTUInt64(new BN("ffffffffffffffff", "hex"));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("ffffffffffffffff");
      expect(buffer.length).to.equal(8);
    });
  });

  describe(".writeChainHash()", () => {
    it("should write value", () => {
      const sut = new TlvValueWriter();
      sut.writeChainHash(Buffer.alloc(32, 255));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal(
        "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      );
      expect(buffer.length).to.equal(32);
    });
  });

  describe(".writeChannelId()", () => {
    it("should write value", () => {
      const sut = new TlvValueWriter();
      sut.writeChannelId(Buffer.alloc(32, 255));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal(
        "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      );
      expect(buffer.length).to.equal(32);
    });
  });

  describe(".writeSha256", () => {
    it("should write value", () => {
      const sut = new TlvValueWriter();
      sut.writeSha256(Buffer.alloc(32, 255));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal(
        "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      );
      expect(buffer.length).to.equal(32);
    });
  });

  describe(".writeSignature", () => {
    it("should write value", () => {
      const sut = new TlvValueWriter();
      sut.writeSignature(Buffer.alloc(64, 255));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal(
        "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      );
      expect(buffer.length).to.equal(64);
    });
  });

  describe(".writePoint", () => {
    it("should write value", () => {
      const sut = new TlvValueWriter();
      sut.writePoint(Buffer.alloc(33, 255));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal(
        "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      );
      expect(buffer.length).to.equal(33);
    });
  });

  describe(".writeShortChannelId", () => {
    it("should write value", () => {
      const sut = new TlvValueWriter();
      sut.writeShortChannelId(new ShortChannelId(1, 2, 3));
      const buffer = sut.toBuffer();
      expect(buffer.toString("hex")).to.equal("0000010000020003");
      expect(buffer.length).to.equal(8);
    });
  });
});
