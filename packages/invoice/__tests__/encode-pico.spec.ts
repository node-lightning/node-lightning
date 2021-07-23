import { expect } from "chai";
import { encodePico } from "../lib/encode-pico";

describe("encode-pico", () => {
    const tests: [string, string][] = [
        // pico bitcoin, encoded value
        ["10", "10p"], // 0.00000000001
        ["100", "100p"], // 0.0000000001
        ["1000", "1n"], // 0.000000001
        ["10000", "10n"], // 0.00000001
        ["100000", "100n"], // 0.0000001
        ["1000000", "1u"], // 0.000001
        ["10000000", "10u"], // 0.00001
        ["100000000", "100u"], // 0.0001
        ["1000000000", "1m"], // 0.001
        ["10000000000", "10m"], // 0.01
        ["100000000000", "100m"], // 0.1
        ["1000000000000", "1"], // 1
        ["10000000000000", "10"], // 10
        ["100000000000000", "100"], // 100

        ["2500000000", "2500u"], // 0.0025
        ["1002500000000", "1002500u"], // 1.0025
        ["1000200501000", "1000200501n"], // 1.000200501
        ["1123412341230", "1123412341230p"], // 1.12341234123
    ];
    for (const [input, expected] of tests) {
        it(`encode amount ${input} to ${expected}`, () => {
            expect(encodePico(input)).to.equal(expected);
        });
    }

    it("should throw if attempts to encode 0", () => {
        expect(() => encodePico("0")).to.throw();
    });
});
