import { expect } from "chai";
import { bigToBufLE } from "../lib/bigToBufLE";

describe(".bigToBufLE", () => {
    const tests: Array<[bigint, Buffer]> = [
        [1n, Buffer.from([1, 0, 0, 0])],
        [16777216n, Buffer.from([0, 0, 0, 1])],
    ];
    for (const test of tests) {
        it(`${test[0]} > ${test[1].toString("hex")}`, () => {
            expect(bigToBufLE(test[0], 4)).to.deep.equal(test[1]);
        });
    }
});
