import { expect } from "chai";
import { varIntBytes } from "../lib/varIntBytes";

describe(".varIntBytes()", () => {
    const tests: Array<[number | BigInt, number]> = [
        [0, 1],
        [1, 1],
        [0xfc, 1],
        [0xfd, 3],
        [0xff, 3],
        [0xfffe, 3],
        [0xffff, 3],
        [0x010000, 5],
        [0xffffff, 5],
        [0xffffffff, 5],
        [0x0100000000, 9],
        [0x01ffffffff, 9],
        [BigInt("0xffffffffffffffff"), 9],
    ];

    for (const [input, expected] of tests) {
        it(`${input} => ${expected}`, () => {
            expect(varIntBytes(input)).to.equal(expected);
        });
    }

    it("throws when below zero", () => {
        expect(() => varIntBytes(-1)).to.throw();
    });

    it("throws when above uint64", () => {
        expect(() => varIntBytes(BigInt("0x01ffffffffffffffff"))).to.throw();
    });
});
