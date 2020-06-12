import { expect } from "chai";
import { ipv4StringToBuffer } from "../../../lib/serialize/address/ipv4StringToBuffer";

const tests: Array<[string, string, Buffer]> = [
    ["localhost", "127.0.0.1", Buffer.from([127, 0, 0, 1])],
    ["standard address", "38.87.54.163", Buffer.from([38, 87, 54, 163])],
    ["max address", "255.255.255.255", Buffer.from("ffffffff", "hex")],
];

describe("ipv4StringFromBuffer", () => {
    for (const [title, input, expected] of tests) {
        it(title, () => {
            const actual = ipv4StringToBuffer(input);
            expect(actual).to.deep.equal(expected);
        });
    }
});
