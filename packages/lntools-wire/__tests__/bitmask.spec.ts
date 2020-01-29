// tslint:disable: no-unused-expression
import { expect } from "chai";
import { Bitmask } from "../lib/bitmask";

describe("Bitmask", () => {
  enum TestFeature {
    Feature1 = "0b01",
    Feature2 = "0b10",
    Feature3 = "0b100",
  }

  describe(".set()", () => {
    it("should set an unset value", () => {
      const sut = new Bitmask<TestFeature>();
      sut.set(TestFeature.Feature1);
      expect(sut.has(TestFeature.Feature1)).to.be.true;
    });

    it("should leave a set value alone", () => {
      const sut = new Bitmask<TestFeature>(BigInt(1));
      expect(sut.has(TestFeature.Feature1)).to.be.true;
      sut.set(TestFeature.Feature1);
      expect(sut.has(TestFeature.Feature1)).to.be.true;
    });
  });

  describe(".unset()", () => {
    it("should unset a set value", () => {
      const sut = new Bitmask<TestFeature>(BigInt(2));
      expect(sut.has(TestFeature.Feature2)).to.be.true;
      sut.unset(TestFeature.Feature2);
      expect(sut.has(TestFeature.Feature2)).to.be.false;
    });

    it("should leave an unset value unset", () => {
      const sut = new Bitmask<TestFeature>();
      expect(sut.has(TestFeature.Feature2)).to.be.false;
      sut.unset(TestFeature.Feature2);
      expect(sut.has(TestFeature.Feature2)).to.be.false;
    });
  });

  describe(".toggle()", () => {
    it("shouuld set an unset value", () => {
      const sut = new Bitmask<TestFeature>();
      sut.toggle(TestFeature.Feature3);
      expect(sut.has(TestFeature.Feature3)).to.be.true;
    });

    it("should unset a set value", () => {
      const sut = new Bitmask<TestFeature>(BigInt(4));
      sut.toggle(TestFeature.Feature3);
      expect(sut.has(TestFeature.Feature3)).to.be.false;
    });
  });
});
