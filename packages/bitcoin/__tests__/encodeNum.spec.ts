import { expect } from "chai";
import { encodeNum } from "../lib/encodeNum";

describe(".encodeNum()", () => {
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
        it(`${test[0].toString().padStart(8, " ")} => ${test[1]}`, () => {
            expect(encodeNum(test[0]).toString("hex")).to.equal(test[1]);
        });
    }
});
