import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { Witness } from "../lib/Witness";

describe("Witness", () => {
    describe("#.parse()", () => {
        it("should parse valid data", () => {
            const reader = StreamReader.fromHex("050001020304");
            const sut = Witness.parse(reader);
            expect(sut.data).to.deep.equal(Buffer.from([0, 1, 2, 3, 4]));
        });
    });

    describe("#.fromHex()", () => {
        it("should parse valid data", () => {
            const sut = Witness.fromHex("050001020304");
            expect(sut.data).to.deep.equal(Buffer.from([0, 1, 2, 3, 4]));
        });
    });

    describe(".serialize()", () => {
        it("should serialize data", () => {
            const sut = new Witness(Buffer.from([0, 1, 2, 3, 4]));
            expect(sut.serialize()).to.deep.equal(Buffer.from([5, 0, 1, 2, 3, 4]));
        });
    });

    describe(".toString()", () => {
        it("should return hex", () => {
            const sut = new Witness(Buffer.from([0, 1, 2, 3, 4]));
            expect(sut.toString()).to.equal("0001020304");
        });
    });

    describe(".toJSON()", () => {
        it("should return hex", () => {
            const sut = new Witness(Buffer.from([0, 1, 2, 3, 4]));
            expect(sut.toJSON()).to.equal("0001020304");
        });
    });

    describe(".clone()", () => {
        it("clones via deep copy", () => {
            const a = new Witness(Buffer.alloc(4));
            const b = a.clone();
            expect(a).to.not.equal(b);
            expect(a.data).to.not.equal(b.data);

            expect(b.data).to.deep.equal(a.data);
        });
    });
});
