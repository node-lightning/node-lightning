import { expect } from "chai";
import { Stack } from "../lib/Stack";
import { Fixture, testFixtures } from "./_TestHelper";

describe("Stack", () => {
    describe("#decodeNum()", () => {
        const fixtures: Fixture<string, string>[] = [
            { expected: "0", input: "" },
            { expected: "1", input: "01" },
            { expected: "-1", input: "81" },
            { expected: "128", input: "8000" },
            { expected: "129", input: "8100" },
            { expected: "-129", input: "8180" },
            { expected: "32785", input: "118000" },
            { expected: "-32785", input: "118080" },
        ];

        const run = (input: string) => Stack.decodeNum(Buffer.from(input, "hex"));

        const assert = (actual: bigint, expected: string) => {
            expect(actual.toString()).to.equal(expected);
        };

        testFixtures(fixtures, run, assert);
    });

    describe("#encodeNum()", () => {
        const fixtures: Fixture<bigint, string>[] = [
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
        ];

        const run = (input: bigint) => Stack.encodeNum(input);

        const assert = (actual: Buffer, expected: string) => {
            expect(actual.toString("hex")).to.equal(expected);
        };

        testFixtures(fixtures, run, assert);
    });
});
