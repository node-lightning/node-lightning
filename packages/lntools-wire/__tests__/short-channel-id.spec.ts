import { expect } from "chai";
import { ShortChannelId } from "../lib/shortchanid";
import * as sut from "../lib/shortchanid";

describe("ShortChannelId", () => {
  describe(".toString", () => {
    it("should return a human readable string", () => {
      const input = new ShortChannelId(1288457, 3, 0);
      const actual = input.toString();
      expect(actual).to.equal("1288457x3x0");
    });
  });

  describe(".toBuffer", () => {
    it("should return a buffer with block as MSBs and voutIdx as LSBs", () => {
      const input = new ShortChannelId(1288457, 3, 0);
      const actual = input.toBuffer();
      expect(actual.toString("hex")).to.deep.equal("13a9090000030000");
    });
  });

  describe(".toNumber", () => {
    it("should return a number value representation of the buffer", () => {
      const input = new ShortChannelId(1288457, 3, 0);
      const actual = input.toNumber();
      expect(actual.toString(10)).to.equal("1416673453389578240");
    });
  });
});

describe("shortChannelIdToBuffer", () => {
  it("should convert the object to a buffer", () => {
    const input = new ShortChannelId(1288457, 3, 0);
    const expected = Buffer.from("13a9090000030000", "hex");
    const result = sut.shortChannelIdToBuffer(input);
    expect(result).to.deep.equal(expected);
  });
});

describe("shortChannelIdToNumber", () => {
  it("should convert the object to a number", () => {
    const input = new ShortChannelId(1288457, 3, 0);
    const result = sut.shortChannelIdToNumber(input);
    expect(result.toString(10)).to.equal("1416673453389578240");
  });
});

describe("shortChannelIdToString", () => {
  it("should convert the buffer to a human readable string", () => {
    const input = new ShortChannelId(539268, 845, 1);
    const result = sut.shortChannelIdToString(input);
    expect(result).to.equal("539268x845x1");
  });
});

describe("shortChannelIdFromString", () => {
  it("should return the object", () => {
    const input = "539268x845x1";
    const result = sut.shortChannelIdFromString(input);
    expect(result).to.deep.equal(new ShortChannelId(539268, 845, 1));
  });

  it("should throw when not a pattern match", () => {
    const input = "1ax2bx3c";
    expect(() => sut.shortChannelIdFromString(input)).to.throw();
  });
});

describe("shortChannelIdFromNumber", () => {
  it("should return the object", () => {
    const input = BigInt("1416673453389578241");
    const expected = new ShortChannelId(1288457, 3, 1);
    const result = sut.shortChannelIdFromNumber(input);
    expect(result).to.deep.equal(expected);
  });

  it("should return the max object", () => {
    const input = BigInt("0xffffffffffffffff");
    const expected = new ShortChannelId(0xffffff, 0xffffff, 0xffff);
    const result = sut.shortChannelIdFromNumber(input);
    expect(result).to.deep.equal(expected);
  });
});

describe("shortChannelIdFromBuffer", () => {
  it("should convert a buffer to an object with parts", () => {
    const input = Buffer.from("083a8400034d0001", "hex");
    const result = sut.shortChannelIdFromBuffer(input);
    expect(result).to.deep.equal(new ShortChannelId(539268, 845, 1));
  });

  it("should throw when not a buffer", () => {
    const input = "abc";
    expect(() => sut.shortChannelIdFromBuffer(input as any)).to.throw();
  });

  it("should throw when incorrect length buffer", () => {
    const input = Buffer.from("083a8400034d", "hex");
    expect(() => sut.shortChannelIdFromBuffer(input)).to.throw();
  });
});
