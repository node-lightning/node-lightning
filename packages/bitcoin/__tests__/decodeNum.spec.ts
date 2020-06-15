import { expect } from "chai";
import { decodeNum } from "../lib/decodeNum";

describe("decodeNum", () => {
    const tests: Array<[bigint, string]> = [
    [0n, ""],
    [1n, "01"],
    [-1n, "81"],
    [128n, "8000"],
    [129n, "8100"],
    [-129n, "8180"],
    [32785n, "118000"],
    [-32785n, "118080"],
  ]; // prettier-ignore

    for (const test of tests) {
        it(`${test[1]} => ${test[0]}`, () => {
            expect(decodeNum(Buffer.from(test[1], "hex")).toString()).to.equal(test[0].toString());
        });
    }
});
