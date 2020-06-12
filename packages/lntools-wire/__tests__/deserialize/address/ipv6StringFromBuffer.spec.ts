import { expect } from "chai";
import { ipv6StringFromBuffer } from "../../../lib/deserialize/address/ipv6StringFromBuffer";

const tests: Array<[string, Buffer, string]> = [
  [
    "Addresses are lower case",
    Buffer.from("aaaabbbbccccddddeeeeffff77778888", "hex"),
    "aaaa:bbbb:cccc:dddd:eeee:ffff:7777:8888",
  ],
  [
    "All non-zero values",
    Buffer.from("11112222333344445555666677778888", "hex"),
    "1111:2222:3333:4444:5555:6666:7777:8888",
  ],
  [
    "Removes leading zeros",
    Buffer.from("00110022003300440055006600770088", "hex"),
    "11:22:33:44:55:66:77:88",
  ],
  [
    "All zero collapses to ::",
    Buffer.from("00000000000000000000000000000000", "hex"),
    "::",
  ],
  [
    "Loopback is as expected",
    Buffer.from("00000000000000000000000000000001", "hex"),
    "::1",
  ],
  [
    "Single collapse start",
    Buffer.from("00002222333344445555666677778888", "hex"),
    "::2222:3333:4444:5555:6666:7777:8888",
  ],
  [
    "Single collapse in middle",
    Buffer.from("11112222000044445555666677778888", "hex"),
    "1111:2222::4444:5555:6666:7777:8888",
  ],
  [
    "Single collapse at end",
    Buffer.from("11112222333344445555666677770000", "hex"),
    "1111:2222:3333:4444:5555:6666:7777::",
  ],
  [
    "Extended collapse in start",
    Buffer.from("00000000333344445555666677778888", "hex"),
    "::3333:4444:5555:6666:7777:8888",
  ],
  [
    "Extended collapse in middle",
    Buffer.from("11112222000000005555666677778888", "hex"),
    "1111:2222::5555:6666:7777:8888",
  ],
  [
    "Extended collapse at end",
    Buffer.from("11112222333344445555666600000000", "hex"),
    "1111:2222:3333:4444:5555:6666::",
  ],
  [
    "Multiple collapse sections ignores future collapse",
    Buffer.from("11110000333300005555000077770000", "hex"),
    "1111::3333:0:5555:0:7777:0",
  ],
  [
    "Multiple nested collapse sections",
    Buffer.from("00000000333300000000666600000000", "hex"),
    "::3333:0:0:6666:0:0",
  ],
]; // prettier-ignore

describe("ipv6StringFromBuffer", () => {
    for (const [title, input, expected] of tests) {
        it(title, () => {
            const actual = ipv6StringFromBuffer(input);
            expect(actual).to.equal(expected);
        });
    }
});
