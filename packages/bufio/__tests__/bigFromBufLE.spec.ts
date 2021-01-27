import { expect } from "chai";
import { bigFromBufLE } from "../lib/bigFromBufLE";

describe(".bigFromBufLE", () => {
    const tests: Array<[Buffer, bigint]> = [
        [Buffer.from([1, 0, 0, 0]), 1n],
        [Buffer.from([, 0, 0, 1]), 16777216n],
    ];
    for (const test of tests) {
        it(`${test[0].toString("hex")} to ${test[1]}`, () => {
            expect(bigFromBufLE(test[0])).to.deep.equal(test[1]);
        });
    }
});
