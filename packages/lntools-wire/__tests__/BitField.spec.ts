// tslint:disable: no-unused-expression
import { expect } from "chai";
import { BitField } from "../lib/BitField";

describe("BitField", () => {
  describe(".set()", () => {
    it("should set an unset value", () => {
      const sut = new BitField();
      sut.set(0);
      expect(sut.isSet(0)).to.be.true;
    });

    it("should leave a set value alone", () => {
      const sut = new BitField(BigInt(1));
      expect(sut.isSet(0)).to.be.true;
      sut.set(0);
      expect(sut.isSet(0)).to.be.true;
    });

    it("should set a large value", () => {
      const sut = new BitField();
      sut.set(64);
      expect(sut.isSet(64)).to.be.true;
    });
  });

  describe(".unset()", () => {
    it("should unset a set value", () => {
      const sut = new BitField(BigInt(2));
      expect(sut.isSet(1)).to.be.true;
      sut.unset(1);
      expect(sut.isSet(1)).to.be.false;
    });

    it("should leave an unset value unset", () => {
      const sut = new BitField();
      expect(sut.isSet(2)).to.be.false;
      sut.unset(2);
      expect(sut.isSet(2)).to.be.false;
    });

    it("should unset a large value", () => {
      const sut = new BitField();
      sut.set(64);
      expect(sut.isSet(64)).to.be.true;
      sut.unset(64);
      expect(sut.isSet(64)).to.be.false;
    });
  });

  describe(".toggle()", () => {
    it("shouuld set an unset value", () => {
      const sut = new BitField();
      sut.toggle(2);
      expect(sut.isSet(2)).to.be.true;
    });

    it("should unset a set value", () => {
      const sut = new BitField(BigInt(4));
      sut.toggle(2);
      expect(sut.isSet(2)).to.be.false;
    });
  });

  describe(".fromBuffer()", () => {
    it("should be zero with empty buffer", () => {
      const input = Buffer.alloc(0);
      expect(BitField.fromBuffer(input).value).to.equal(BigInt(0));
    });

    it("should be value with buffer value", () => {
      const input = Buffer.from("01e229", "hex");
      expect(BitField.fromBuffer(input).value).to.equal(BigInt(123433));
    });
  });

  describe(".toBuffer()", () => {
    it("should return empty buffer when zero", () => {
      const sut = new BitField();
      expect(sut.toBuffer()).to.deep.equal(Buffer.alloc(0));
    });

    it("should return buffer for full value", () => {
      const sut = BitField.fromNumber(255);
      expect(sut.toBuffer()).to.deep.equal(Buffer.from([255]));
    });

    it("should return buffer for partial byte value", () => {
      const sut = BitField.fromNumber(123433);
      expect(sut.toBuffer()).to.deep.equal(Buffer.from("01e229", "hex"));
    });
  });
});
