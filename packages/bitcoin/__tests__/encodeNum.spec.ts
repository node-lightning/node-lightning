import { expect } from "chai";
import { encodeNum } from "../lib/encodeNum";

describe(".encodeNum()", () => {
    const tests: Array<[bigint, string]> = [
    [0n, ""],
    [1n, "01"],
    [2n, "02"],
    [3n, "03"],
    [4n, "04"],
    [5n, "05"],
    [6n, "06"],
    [7n, "07"],
    [8n, "08"],
    [9n, "09"],
    [10n, "0a"],
    [11n, "0b"],
    [12n, "0c"],
    [13n, "0d"],
    [14n, "0e"],
    [15n, "0f"],
    [16n, "10"],
    [17n, "11"],
    [18n, "12"],
    [19n, "13"],
    [20n, "14"],
    [-1n, "81"],
    [128n, "8000"],
    [129n, "8100"],
    [-129n, "8180"],
    [32785n, "118000"],
    [-32785n, "118080"],
  ]; // prettier-ignore

    for (const test of tests) {
        it(`${test[0].toString().padStart(8, " ")} => ${test[1]}`, () => {
            const actual = encodeNum(test[0]);
            expect(actual.toString("hex")).to.equal(test[1]);
        });
    }
});
