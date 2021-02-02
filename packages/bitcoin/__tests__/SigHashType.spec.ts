import { expect } from "chai";
import { isSigHashTypeValid, SigHashType } from "../lib/SigHashType";
import { Fixture, testFixtures } from "./_TestHelper";

describe("SigHashType", () => {
    describe(".isSigHashTypeValid", () => {
        const fixtures: Array<Fixture<number, boolean>> = [
            {
                title: "SIGHASH_ALL",
                input: SigHashType.SIGHASH_ALL,
                expected: true,
            },
            {
                title: "SIGHASH_NONE",
                input: SigHashType.SIGHASH_NONE,
                expected: true,
            },
            {
                title: "SIGHASH_SINGLE",
                input: SigHashType.SIGHASH_SINGLE,
                expected: true,
            },
            {
                title: "SIGHASH_ALL | SIGHASH_ANYONECANPAY",
                input: SigHashType.SIGHASH_ALL | SigHashType.SIGHASH_ANYONECANPAY,
                expected: true,
            },
            {
                title: "SIGHASH_NONE | SIGHASH_ANYONECANPAY",
                input: SigHashType.SIGHASH_NONE | SigHashType.SIGHASH_ANYONECANPAY,
                expected: true,
            },
            {
                title: "SIGHASH_SINGLE | SIGHASH_ANYONECANPAY",
                input: SigHashType.SIGHASH_SINGLE | SigHashType.SIGHASH_ANYONECANPAY,
                expected: true,
            },
            {
                title: "SIGHASH_ANYONECANPAY fails",
                input: SigHashType.SIGHASH_ANYONECANPAY,
                expected: false,
            },
            {
                title: "unknown fails",
                input: 20,
                expected: false,
            },
        ];

        const run = isSigHashTypeValid;
        const assert = (actual: boolean, expected: boolean) => expect(actual).to.equal(expected);
        testFixtures(fixtures, run, assert);
    });
});
