import { expect } from "chai";
import { Bech32 } from "../lib/Bech32";

describe("Bech32", () => {
    describe(".wordsToBuffer()", () => {
        describe("without common denominator", () => {
            const words = [0, 1, 2, 3];

            it("pad=true, includes overflowed words", () => {
                const result = Bech32.wordsToBuffer(words, true);
                expect(result.toString("hex")).to.equal("004430");
            });

            it("pad=false, throws", () => {
                expect(() => Bech32.wordsToBuffer(words, false)).to.throw(
                    "Invalid bech32 encoding",
                );
            });
        });

        describe("with common denominator", () => {
            const words = [0, 1, 2, 3, 4, 5, 6, 7];

            it("pad=true", () => {
                const result = Bech32.wordsToBuffer(words, true);
                expect(result.toString("hex")).to.equal("00443214c7");
            });

            it("pad=false", () => {
                const result = Bech32.wordsToBuffer(words, false);
                expect(result.toString("hex")).to.equal("00443214c7");
            });
        });
    });

    describe(".bufferToWords()", () => {
        describe("without common denominator", () => {
            const buffer = Buffer.from("004430", "hex");
            it("pad=true, includes additional zero word", () => {
                const result = Bech32.bufferToWords(buffer, true);
                expect(result).to.deep.equal([0, 1, 2, 3, 0]);
            });

            it("pad=false, excludes additional zero word", () => {
                const result = Bech32.bufferToWords(buffer, false);
                expect(result).to.deep.equal([0, 1, 2, 3]);
            });
        });
    });

    describe(".sizeOfNum()", () => {
        const tests: [number, number][] = [
            [0, 1],
            [1, 1],
            [31, 1],
            [32, 2],
            [1023, 2],
            [1024, 3],
            [0b10000_00000_00000_00000, 4],
            [0b10000_00000_00000_00000_00000, 5],
            [0b10000_00000_00000_00000_00000_00000, 6],
        ];

        for (const [input, output] of tests) {
            it(`${input} => ${output}`, () => {
                expect(Bech32.sizeofNum(input)).to.equal(output);
            });
        }
    });

    describe(".sizeOfBits()", () => {
        const tests: [number, number][] = [
            [1, 1],
            [5, 1],
            [6, 2],
            [11, 3],
            [16, 4],
        ];

        for (const [input, output] of tests) {
            it(`${input} => ${output}`, () => {
                expect(Bech32.sizeofBits(input)).to.equal(output);
            });
        }
    });

    describe(".sizeOfBytes", () => {
        const tests: [number, number][] = [
            [1, 2],
            [2, 4],
            [3, 5],
            [4, 7],
            [5, 8],
        ];

        for (const [input, output] of tests) {
            it(`${input} => ${output}`, () => {
                expect(Bech32.sizeofBytes(input)).to.equal(output);
            });
        }
    });

    describe("BIP173 Vectors", () => {
        const valid = [
            "A12UEL5L",
            "a12uel5l",
            "an83characterlonghumanreadablepartthatcontainsthenumber1andtheexcludedcharactersbio1tt5tgs",
            "abcdef1qpzry9x8gf2tvdw0s3jn54khce6mua7lmqqqxw",
            "11qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc8247j",
            "split1checkupstagehandshakeupstreamerranterredcaperred2y9e3w",
            "?1ezyfcl",
        ];

        for (const test of valid) {
            it("valid " + test, () => {
                const decoded = Bech32.decode(test);
                const encoded = Bech32.encode(decoded.hrp, decoded.words);
                expect(encoded).to.equal(test.toLowerCase());
            });
        }

        const invalid = [
            "\x201nwldj5", // HRP character out of range
            "\x7f1axkwrx", // HRP character out of range
            "\x801eym55h", // HRP character out of range
            // "an84characterslonghumanreadablepartthatcontainsthenumber1andtheexcludedcharactersbio1569pvx", // overall max length exceeded
            "pzry9x0s0muk", // No separator character
            "1pzry9x0s0muk", // Empty HRP
            "x1b4n0q5v", // Invalid data character
            "li1dgmt3", // Too short checksum
            "de1lg7wt" + 0xff, // Invalid character in checksum
            "A1G7SGD8", // checksum calculated with uppercase form of HRP
            "10a06t8", // empty HRP
            "1qzzfhee", // empty HRP
            "bc1Atw", // mixed cases
        ];

        for (const test of invalid) {
            it("invalid " + test, () => {
                expect(() => Bech32.decode(test)).to.throw();
            });
        }
    });

    describe("BIP350 Vectors", () => {
        const valid = [
            "A1LQFN3A",
            "a1lqfn3a",
            "an83characterlonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber11sg7hg6",
            "abcdef1l7aum6echk45nj3s0wdvt2fg8x9yrzpqzd3ryx",
            "11llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllludsr8",
            "split1checkupstagehandshakeupstreamerranterredcaperredlc445v",
            "?1v759aa",
        ];

        for (const test of valid) {
            it("valid " + test, () => {
                const decoded = Bech32.decode(test);
                const encoded = Bech32.encode(decoded.hrp, decoded.words, decoded.version);
                expect(encoded).to.equal(test.toLowerCase());
            });
        }

        const invalid = [
            "\x201xj0phk", // HRP character out of range
            "\x7f1g6xzxy", // HRP character out of range
            "\x801vctc34", // HRP character out of range
            // "an84characterslonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber11d6pts4", // overall max length exceeded
            "qyrz8wqd2c9m", // No separator character
            "1qyrz8wqd2c9m", // Empty HRP
            "y1b0jsk6g", // Invalid data character
            "lt1igcx5c0", // Invalid data character
            "in1muywd", // Too short checksum
            "mm1crxm3i", // Invalid character in checksum
            "au1s5cgom", // Invalid character in checksum
            "M1VUXWEZ", // checksum calculated with uppercase form of HRP
            "16plkw9", // empty HRP
            "1p2gdwpf", // empty HRP
        ];

        for (const test of invalid) {
            it("invalid " + test, () => {
                expect(() => Bech32.decode(test)).to.throw();
            });
        }
    });
});
