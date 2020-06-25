import { expect } from "chai";
import { Base32 } from "../lib/Base32";
describe("Base32", () => {
    describe("encode()", () => {
        const tests: Array<[string, string]> = [
            ["", ""],
            ["f", "MY======"],
            ["fo", "MZXQ===="],
            ["foo", "MZXW6==="],
            ["foob", "MZXW6YQ="],
            ["fooba", "MZXW6YTB"],
            ["foobar", "MZXW6YTBOI======"],
        ];

        for (const test of tests) {
            it(`${test[0]}`, () => {
                expect(Base32.encode(Buffer.from(test[0]))).to.equal(test[1]);
            });
        }
    });

    // describe("decode()", () => {
    //     const tests: Array<[string, string]> = [
    //         ["", ""],
    //         ["f", "MY======"],
    //         ["fo", "MZXQ===="],
    //         ["foo", "MZXW6==="],
    //         ["foob", "MZXW6YQ="],
    //         ["fooba", "MZXW6YTB"],
    //         ["foobar", "MZXW6YTBOI======"],
    //     ];

    //     for (const test of tests) {
    //         it(`${test[1]}`, () => {
    //             expect(Base32.decode(test[1])).to.deep.equal(Buffer.from(test[0]));
    //         });
    //     }
    // });
});
