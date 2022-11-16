import { expect } from "chai";
import { ipv6StringToBuffer } from "../../../lib/serialize/address/ipv6StringToBuffer";

const tests: Array<[string, string, Buffer]> = [
  [
    "Addresses are lower case",
    "aaaa:bbbb:cccc:dddd:eeee:ffff:7777:8888",
    Buffer.from("aaaabbbbccccddddeeeeffff77778888", "hex"),
  ],
  [
    "All non-zero values",
    "1111:2222:3333:4444:5555:6666:7777:8888",
    Buffer.from("11112222333344445555666677778888", "hex"),
  ],
  [
    "Removes leading zeros",
    "11:22:33:44:55:66:77:88",
    Buffer.from("00110022003300440055006600770088", "hex"),
  ],
  [
    "All zero collapses to ::",
    "::",
    Buffer.from("00000000000000000000000000000000", "hex"),
  ],
  [
    "Loopback is as expected",
    "::1",
    Buffer.from("00000000000000000000000000000001", "hex"),
  ],
  [
    "Single collapse start",
    "::2222:3333:4444:5555:6666:7777:8888",
    Buffer.from("00002222333344445555666677778888", "hex"),
  ],
  [
    "Single collapse in middle",
    "1111:2222::4444:5555:6666:7777:8888",
    Buffer.from("11112222000044445555666677778888", "hex"),
  ],
  [
    "Single collapse at end",
    "1111:2222:3333:4444:5555:6666:7777::",
    Buffer.from("11112222333344445555666677770000", "hex"),
  ],
  [
    "Extended collapse in start",
    "::3333:4444:5555:6666:7777:8888",
    Buffer.from("00000000333344445555666677778888", "hex"),
  ],
  [
    "Extended collapse in middle",
    "1111:2222::5555:6666:7777:8888",
    Buffer.from("11112222000000005555666677778888", "hex"),
  ],
  [
    "Extended collapse at end",
    "1111:2222:3333:4444:5555:6666::",
    Buffer.from("11112222333344445555666600000000", "hex"),
  ],
  [
    "Multiple collapse sections ignores future collapse",
    "1111::3333:0:5555:0:7777:0",
    Buffer.from("11110000333300005555000077770000", "hex"),
  ],
  [
    "Multiple nested collapse sections",
    "::3333:0:0:6666:0:0",
    Buffer.from("00000000333300000000666600000000", "hex"),
  ],
]; // prettier-ignore

describe("ipv6StringToBuffer", () => {
    for (const [title, input, expected] of tests) {
        it(title, () => {
            const actual = ipv6StringToBuffer(input);
            expect(actual).to.deep.equal(expected);
        });
    }
});
