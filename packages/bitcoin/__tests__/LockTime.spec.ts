import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { LockTime } from "../lib/LockTime";
import { TimeLockMode } from "../lib/TimeLockMode";

describe("TxLockTime", () => {
    describe("#.parse()", () => {
        it("parses simple value", () => {
            const input = StreamReader.fromHex("00000001");
            const sut = LockTime.parse(input);
            expect(sut.value).to.equal(16777216);
        });
    });

    describe("#.zero()", () => {
        it("creates an nLockTime with zero", () => {
            const sut = LockTime.zero();
            expect(sut.value).to.equal(0);
        });
    });

    describe(".value", () => {
        it("gets or sets values", () => {
            expect(new LockTime().value).to.equal(0xffff_ffff);
            expect(new LockTime(0).value).to.equal(0);
            expect(new LockTime(1).value).to.equal(1);
            expect(new LockTime(0xefff_ffff).value).to.equal(0xefff_ffff);
        });

        it("rejects an invalid value", () => {
            expect(() => new LockTime(-1)).to.throw();
            expect(() => new LockTime(0x01_0000_0000)).to.throw();
        });
    });

    describe(".isEnabled", () => {
        it("false when default value", () => {
            expect(new LockTime().isEnabled).to.equal(false);
            expect(new LockTime(0xffff_ffff).isEnabled).to.equal(false);
        });

        it("true when not default", () => {
            expect(new LockTime(0).isEnabled).to.equal(true);
            expect(new LockTime(1).isEnabled).to.equal(true);
            expect(new LockTime(0xfeff_ffff).isEnabled).to.equal(true);
        });
    });

    describe(".type", () => {
        it("returns block when below 500,000,000", () => {
            expect(new LockTime(0).type).to.equal(TimeLockMode.Block);
            expect(new LockTime(1000).type).to.equal(TimeLockMode.Block);
            expect(new LockTime(499_999_999).type).to.equal(TimeLockMode.Block);
        });

        it("returns time when gte to 500,000,000", () => {
            expect(new LockTime(500_000_000).type).to.equal(TimeLockMode.Time);
            expect(new LockTime(Math.floor(Date.now() / 1000)).type).to.equal(TimeLockMode.Time);
            expect(new LockTime(0xffff_ffff).type).to.equal(TimeLockMode.Time);
        });
    });

    describe(".serialize()", () => {
        it("serializes to a UInt32LE buffer", () => {
            expect(new LockTime(0).serialize()).to.deep.equal(Buffer.from([0, 0, 0, 0]));
            expect(new LockTime(1000).serialize()).to.deep.equal(Buffer.from([232, 3, 0, 0]));
            expect(new LockTime().serialize()).to.deep.equal(Buffer.from([255, 255, 255, 255]));
        });
    });

    describe(".toString()", () => {
        it("returns the string value", () => {
            expect(new LockTime().toString()).to.equal("4294967295");
        });
    });

    describe(".toJSON()", () => {
        it("returns the numeric value", () => {
            expect(new LockTime().toJSON()).to.equal(4294967295);
        });
    });

    describe(".clone()", () => {
        it("clones via deep copy", () => {
            const a = new LockTime(1000);
            const b = a.clone();
            expect(a).to.not.equal(b);
            expect(b.type).to.equal(a.type);
            expect(b.value).to.equal(b.value);
        });
    });
});
