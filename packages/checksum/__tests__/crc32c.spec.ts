import { expect } from "chai";
import { crc32c } from "../lib/crc32c";

describe("crc32c", () => {
    const tests: Array<[string, number]> = [
        ["", 0],
        ["0000000000000000000000000000000000000000000000000000000000000000", 0x8a9136aa],
        ["ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", 0x62a8ab43],
        ["000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", 0x46dd794e],
        ["1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100", 0x113fdb5c],
        ["01c000000000000000000000000000001400000000000400000000140000001828000000000000000200000000000000", 0xd9963a56], // prettier-ignore
    ];
    for (const test of tests) {
        it(`${test[0]} => ${test[1]}`, () => {
            expect(crc32c(Buffer.from(test[0], "hex"))).to.equal(test[1]);
        });
    }
});
