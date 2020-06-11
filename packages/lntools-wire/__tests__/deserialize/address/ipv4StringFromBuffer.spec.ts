import { expect } from "chai";
import { ipv4StringFromBuffer } from "../../../lib/deserialize/address/ipv4StringFromBuffer";

const tests: Array<[string, Buffer, string]> = [
  [
    "localhost",
    Buffer.from([127,0,0,1]),
    "127.0.0.1",
  ],
  [
    "standard address",
    Buffer.from([38, 87, 54, 163]),
    "38.87.54.163",
  ],
  [
    "max address",
    Buffer.from("ffffffff", "hex"),
    "255.255.255.255",
  ],
]; // prettier-ignore

describe("ipv4StringFromBuffer", () => {
    for (const [title, input, expected] of tests) {
        it(title, () => {
            const actual = ipv4StringFromBuffer(input);
            expect(actual).to.equal(expected);
        });
    }
});
