import { expect } from "chai";
import { TimeLockMode } from "../lib/TimeLockMode";
import { TxInSequence } from "../lib/TxInSequence";

describe("TxInSequence", () => {
    it("defaults to 0xffff_ffff", () => {
        const sut = new TxInSequence();
        expect(sut.value).to.equal(0xffff_ffff);
        expect(sut.enabled).to.equal(false);
    });

    it("throws with value below zero", () => {
        expect(() => new TxInSequence(-1)).to.throw();
    });

    it("throws with value below 0xffff_ffff", () => {
        expect(() => new TxInSequence(0xffff_ffff_ff));
    });

    it("locked for 4096 seconds", () => {
        const sut = new TxInSequence(0x00400008);
        expect(sut.enabled).to.equal(true);
        expect(sut.mode).to.equal(TimeLockMode.Time);
        expect(sut.timeDelay).to.equal(4096);
    });

    it("disabled, but non-default value, non-locktime value", () => {
        const sut = new TxInSequence(0xfedc3210);
        expect(sut.enabled).to.equal(false);
        expect(sut.isDefault).to.equal(false);
    });

    it("locked for 16 blocks", () => {
        const sut = new TxInSequence(0x00000010);
        expect(sut.enabled).to.equal(true);
        expect(sut.mode).to.equal(TimeLockMode.Block);
        expect(sut.blockDelay).to.equal(16);
    });

    it("disabled, enables locktime", () => {
        const sut = new TxInSequence(0xfffffffe);
        expect(sut.enabled).to.equal(false);
        expect(sut.value).to.equal(0xfffffffe);
    });

    it("sets time delay and rounds up to nearest 512 second granularity", () => {
        const sut = new TxInSequence();
        sut.timeDelay = 1500;
        expect(sut.enabled).to.equal(true);
        expect(sut.mode).to.equal(TimeLockMode.Time);
        expect(sut.timeDelay).to.equal(1536);
        expect(sut.value).to.equal(0x0040_0003);
    });

    it("sets block delay", () => {
        const sut = new TxInSequence();
        sut.blockDelay = 144;
        expect(sut.enabled).to.equal(true);
        expect(sut.mode).to.equal(TimeLockMode.Block);
        expect(sut.blockDelay).to.equal(144);
        expect(sut.value).to.equal(0x0000_0090);
    });
});
