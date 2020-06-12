import { expect } from "chai";
import { torStringToBuffer } from "../../../lib/serialize/address/torStringToBuffer";

const tests: Array<[string, string, Buffer]> = [
  [
    "Tor v2 address",
    "3g2upl4pq6kufc4m.onion",
    Buffer.from("d9b547af8f8795428b8c", "hex"),
  ],
  [
    "Tor v3 address",
    "ajnvpgl6prmkb7yktvue6im5wiedlz2w32uhcwaamdiecdrfpwwgnlqd.onion",
    Buffer.from("025b57997e7c58a0ff0a9d684f219db20835e756dea871580060d0410e257dac66ae03", "hex"),
  ],
]; // prettier-ignore

describe("torStringToBuffer", () => {
    for (const [title, input, expected] of tests) {
        it(title, () => {
            const actual = torStringToBuffer(input);
            expect(actual).to.deep.equal(expected);
        });
    }
});
