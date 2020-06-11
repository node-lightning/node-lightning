import { expect } from "chai";
import { torStringFromBuffer } from "../../../lib/deserialize/address/torStringFromBuffer";

const tests: Array<[string, Buffer, string]> = [
  [
    "Tor v2 address",
    Buffer.from("d9b547af8f8795428b8c", "hex"),
    "3g2upl4pq6kufc4m.onion",
  ],
  [
    "Tor v3 address",
    Buffer.from("025b57997e7c58a0ff0a9d684f219db20835e756dea871580060d0410e257dac66ae03", "hex"),
    "ajnvpgl6prmkb7yktvue6im5wiedlz2w32uhcwaamdiecdrfpwwgnlqd.onion",
  ],
]; // prettier-ignore

describe("torStringFromBuffer", () => {
    for (const [title, input, expected] of tests) {
        it(title, () => {
            const actual = torStringFromBuffer(input);
            expect(actual).to.equal(expected);
        });
    }
});
