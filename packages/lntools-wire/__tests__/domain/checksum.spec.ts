import { expect } from "chai";
import { Checksum } from "../../lib/domain/Checksum";

describe("Checksum", () => {
    describe(".empty()", () => {
        it("should return empty buffer", () => {
            expect(Checksum.empty().toBuffer()).to.deep.equal(Buffer.alloc(4));
        });
    });

    describe(".equals()", () => {
        it("should return false when not equal", () => {
            const a = Checksum.fromBuffer(Buffer.from("a"));
            const b = Checksum.fromBuffer(Buffer.from("b"));
            expect(a.equals(b)).to.equal(false);
        });

        it("should return true when equal", () => {
            const a = Checksum.fromBuffer(Buffer.from("a"));
            const b = Checksum.fromBuffer(Buffer.from("a"));
            expect(a.equals(b)).to.equal(true);
        });
    });

    describe(".toNumber()", () => {
        it("should return the number", () => {
            const sut = Checksum.fromBuffer(Buffer.from("a"));
            expect(sut.toNumber()).to.equal(3251651376);
        });
    });

    describe(".toBuffer()", () => {
        it("shoudl return expected buffer", () => {
            const sut = Checksum.fromBuffer(Buffer.from("a"));
            expect(sut.toBuffer().toString("hex")).to.deep.equal("c1d04330");
        });
    });

    describe(".toString()", () => {
        it("shoudl return expected buffer", () => {
            const sut = Checksum.fromBuffer(Buffer.from("a"));
            expect(sut.toString()).to.deep.equal("c1d04330");
        });
    });
});
