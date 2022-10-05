import { expect } from "chai";
import { uintBytes } from "../lib/UintBytes";

describe(uintBytes.name, () => {
    const tests: Array<[number, number]> = [
        [0, 0],
        [1, 1],
        [255, 1],
        [256, 2],
        [65535, 2],
        [65536, 3],
    ];
    for (const test of tests) {
        it(`${test[0]} === ${test[1]} bytes`, () => {
            expect(uintBytes(test[0])).to.deep.equal(test[1]);
        });
    }
});
