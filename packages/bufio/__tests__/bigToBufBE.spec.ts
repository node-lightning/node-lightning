import { expect } from "chai";
import { bigToBufBE } from "../lib/bigToBufBE";

describe(".bigToBufBE", () => {
    const tests: Array<[[bigint, number], Buffer]> = [
        [[1n, 4], Buffer.from([0, 0, 0, 1])],
        [[16777216n, 4], Buffer.from([1, 0, 0, 0])],
        [[16777216n, undefined], Buffer.from([1, 0, 0, 0])],
    ];
    for (const test of tests) {
        it(`${test[0]} > ${test[1].toString("hex")}`, () => {
            expect(bigToBufBE(...test[0])).to.deep.equal(test[1]);
        });
    }
});
