import { expect } from "chai";
import { Base32 } from "../lib/Base32";
describe("Base32", () => {
    describe("encode()", () => {
        const tests: Array<[Buffer, string]> = [
            [Buffer.from(""), ""],
            [Buffer.from("f"), "MY======"],
            [Buffer.from("fo"), "MZXQ===="],
            [Buffer.from("foo"), "MZXW6==="],
            [Buffer.from("foob"), "MZXW6YQ="],
            [Buffer.from("fooba"), "MZXW6YTB"],
            [Buffer.from("foobar"), "MZXW6YTBOI======"],
            [Buffer.from("00", "hex"), "AA======"],
            [Buffer.from("01", "hex"), "AE======"],
            [Buffer.from("0101", "hex"), "AEAQ===="],
            [Buffer.from("010101", "hex"), "AEAQC==="],
            [Buffer.from("01010101", "hex"), "AEAQCAI="],
            [Buffer.from("0101010101", "hex"), "AEAQCAIB"],
        ];

        for (const test of tests) {
            it(`${test[0]} => ${test[1]}`, () => {
                expect(Base32.encode(test[0])).to.equal(test[1]);
            });
        }
    });

    describe("decode()", () => {
        const tests: Array<[Buffer, string]> = [
            [Buffer.from(""), ""],
            [Buffer.from("f"), "MY======"],
            [Buffer.from("fo"), "MZXQ===="],
            [Buffer.from("foo"), "MZXW6==="],
            [Buffer.from("foob"), "MZXW6YQ="],
            [Buffer.from("fooba"), "MZXW6YTB"],
            [Buffer.from("foobar"), "MZXW6YTBOI======"],
            [Buffer.from("00", "hex"), "AA======"],
            [Buffer.from("01", "hex"), "AE======"],
            [Buffer.from("0101", "hex"), "AEAQ===="],
            [Buffer.from("010101", "hex"), "AEAQC==="],
            [Buffer.from("01010101", "hex"), "AEAQCAI="],
            [Buffer.from("0101010101", "hex"), "AEAQCAIB"],
        ];

        for (const test of tests) {
            it(`${test[1]} => ${test[0]}`, () => {
                expect(Base32.decode(test[1])).to.deep.equal(test[0]);
            });
        }
    });
});
