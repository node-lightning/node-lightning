// tslint:disable: no-unused-expression
import { expect } from "chai";
import { Bitmask } from "../lib/bitmask";

describe("Bitmask", () => {
  describe(".set()", () => {
    it("should set an unset value", () => {
      const sut = new Bitmask();
      sut.set(0);
      expect(sut.has(0)).to.be.true;
    });

    it("should leave a set value alone", () => {
      const sut = new Bitmask(BigInt(1));
      expect(sut.has(0)).to.be.true;
      sut.set(0);
      expect(sut.has(0)).to.be.true;
    });

    it("should set a large value", () => {
      const sut = new Bitmask();
      sut.set(64);
      expect(sut.has(64)).to.be.true;
    });
  });

  describe(".unset()", () => {
    it("should unset a set value", () => {
      const sut = new Bitmask(BigInt(2));
      expect(sut.has(1)).to.be.true;
      sut.unset(1);
      expect(sut.has(1)).to.be.false;
    });

    it("should leave an unset value unset", () => {
      const sut = new Bitmask();
      expect(sut.has(2)).to.be.false;
      sut.unset(2);
      expect(sut.has(2)).to.be.false;
    });

    it("should unset a large value", () => {
      const sut = new Bitmask();
      sut.set(64);
      expect(sut.has(64)).to.be.true;
      sut.unset(64);
      expect(sut.has(64)).to.be.false;
    });
  });

  describe(".toggle()", () => {
    it("shouuld set an unset value", () => {
      const sut = new Bitmask();
      sut.toggle(2);
      expect(sut.has(2)).to.be.true;
    });

    it("should unset a set value", () => {
      const sut = new Bitmask(BigInt(4));
      sut.toggle(2);
      expect(sut.has(2)).to.be.false;
    });
  });
});
