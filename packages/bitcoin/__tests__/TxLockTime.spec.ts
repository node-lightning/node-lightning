import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { TimeLockMode } from "../lib/TimeLockMode";
import { TxLockTime } from "../lib/TxLockTime";

describe("TxLockTime", () => {
    describe("#.parse()", () => {
        it("parses simple value", () => {
            const input = StreamReader.fromHex("00000001");
            const sut = TxLockTime.parse(input);
            expect(sut.value).to.equal(16777216);
        });
    });

    describe(".value", () => {
        it("gets or sets values", () => {
            expect(new TxLockTime().value).to.equal(0xffff_ffff);
            expect(new TxLockTime(0).value).to.equal(0);
            expect(new TxLockTime(1).value).to.equal(1);
            expect(new TxLockTime(0xefff_ffff).value).to.equal(0xefff_ffff);
        });

        it("rejects an invalid value", () => {
            expect(() => new TxLockTime(-1)).to.throw();
            expect(() => new TxLockTime(0x01_0000_0000)).to.throw();
        });
    });

    describe(".isEnabled", () => {
        it("false when default value", () => {
            expect(new TxLockTime().isEnabled).to.equal(false);
            expect(new TxLockTime(0xffff_ffff).isEnabled).to.equal(false);
        });

        it("true when not default", () => {
            expect(new TxLockTime(0).isEnabled).to.equal(true);
            expect(new TxLockTime(1).isEnabled).to.equal(true);
            expect(new TxLockTime(0xfeff_ffff).isEnabled).to.equal(true);
        });
    });

    describe(".type", () => {
        it("returns block when below 500,000,000", () => {
            expect(new TxLockTime(0).type).to.equal(TimeLockMode.Block);
            expect(new TxLockTime(1000).type).to.equal(TimeLockMode.Block);
            expect(new TxLockTime(499_999_999).type).to.equal(TimeLockMode.Block);
        });

        it("returns time when gte to 500,000,000", () => {
            expect(new TxLockTime(500_000_000).type).to.equal(TimeLockMode.Time);
            expect(new TxLockTime(Math.floor(Date.now() / 1000)).type).to.equal(TimeLockMode.Time);
            expect(new TxLockTime(0xffff_ffff).type).to.equal(TimeLockMode.Time);
        });
    });

    describe(".serialize()", () => {
        it("serializes to a UInt32LE buffer", () => {
            expect(new TxLockTime(0).serialize()).to.deep.equal(Buffer.from([0, 0, 0, 0]));
            expect(new TxLockTime(1000).serialize()).to.deep.equal(Buffer.from([232, 3, 0, 0]));
            expect(new TxLockTime().serialize()).to.deep.equal(Buffer.from([255, 255, 255, 255]));
        });
    });

    describe(".toString()", () => {
        it("returns the string value", () => {
            expect(new TxLockTime().toString()).to.equal("4294967295");
        });
    });

    describe(".toJSON()", () => {
        it("returns the numeric value", () => {
            expect(new TxLockTime().toJSON()).to.equal(4294967295);
        });
    });
});
