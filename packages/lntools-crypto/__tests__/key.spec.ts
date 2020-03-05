// tslint:disable: no-unused-expression
import { expect } from "chai";
import * as key from "../lib/key";

describe(".validPrivateKey()", () => {
  it("should return false when not a buffer", () => {
    expect(key.validPrivateKey(1 as any)).to.be.false;
  });

  it("should return false when Buffer not 32-bytes", () => {
    expect(key.validPrivateKey(Buffer.alloc(8))).to.be.false;
  });

  it("should return false when <= 0x1", () => {
    const result = key.validPrivateKey(Buffer.alloc(32));
    expect(result).to.be.false;
  });

  it("should return false when >= fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140", () => {
    const result = key.validPrivateKey(
      Buffer.from("ffffffffffffffffffffffffffffffffbaaedce6af48a03bbfd25e8cd0364141", "hex"),
    );
    expect(result).to.be.false;
  });

  it("should return true when 1", () => {
    const result = key.validPrivateKey(
      Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"),
    );
    expect(result).to.be.true;
  });

  it("should return true when fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140", () => {
    const result = key.validPrivateKey(
      Buffer.from("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140", "hex"),
    );
    expect(result).to.be.true;
  });
});

describe(".createPrivateKey()", () => {
  it("should return valid key", () => {
    const actual = key.createPrivateKey();
    expect(actual.length).to.equal(32);
    expect(BigInt("0x" + actual.toString("hex")) > BigInt(0)).to.be.true;
    expect(
      BigInt("0x" + actual.toString("hex")) <
        BigInt("0x" + "ffffffffffffffffffffffffffffffffbaaedce6af48a03bbfd25e8cd0364141"),
    ).to.be.true;
  });
});

describe(".getPublicKey()", () => {
  it("should return uncompressed value", () => {
    const privkey = Buffer.from(
      "1111111111111111111111111111111111111111111111111111111111111111",
      "hex",
    );
    expect(key.getPublicKey(privkey, false).toString("hex")).to.equal(
      "044f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa385b6b1b8ead809ca67454d9683fcf2ba03456d6fe2c4abe2b07f0fbdbb2f1c1",
    );
  });

  it("should return compressed value", () => {
    const privkey = Buffer.from(
      "1111111111111111111111111111111111111111111111111111111111111111",
      "hex",
    );
    expect(key.getPublicKey(privkey, true).toString("hex")).to.equal(
      "034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa",
    );
  });
});
