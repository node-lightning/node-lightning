import { expect } from "chai";
import { encodeNum } from "../lib/encodeNum";

describe(".encodeNum()", () => {
    const tests: Array<[bigint, string]> = [
    [0n, "OP_CODE 0x0"],
    [1n, "OP_CODE 0x51"],
    [2n, "OP_CODE 0x52"],
    [3n, "OP_CODE 0x53"],
    [4n, "OP_CODE 0x54"],
    [5n, "OP_CODE 0x55"],
    [6n, "OP_CODE 0x56"],
    [7n, "OP_CODE 0x57"],
    [8n, "OP_CODE 0x58"],
    [9n, "OP_CODE 0x59"],
    [10n, "OP_CODE 0x5a"],
    [11n, "OP_CODE 0x5b"],
    [12n, "OP_CODE 0x5c"],
    [13n, "OP_CODE 0x5d"],
    [14n, "OP_CODE 0x5e"],
    [15n, "OP_CODE 0x5f"],
    [16n, "OP_CODE 0x60"],
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
            if (actual instanceof Buffer) {
                expect(actual.toString("hex")).to.equal(test[1]);
            } else {
                expect("OP_CODE 0x" + actual.toString(16)).to.equal(test[1]);
            }
        });
    }
});
