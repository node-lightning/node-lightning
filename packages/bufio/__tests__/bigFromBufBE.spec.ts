import { expect } from "chai";
import { bigFromBufBE } from "../lib/bigFromBufBE";

describe(".bigFromBufBE", () => {
    const tests: Array<[Buffer, bigint]> = [
        [Buffer.from([0, 0, 0, 1]), 1n],
        [Buffer.from([1, 0, 0, 0]), 16777216n],
    ];
    for (const test of tests) {
        it(`${test[0].toString("hex")} to ${test[1]}`, () => {
            expect(bigFromBufBE(test[0])).to.deep.equal(test[1]);
        });
    }
});
