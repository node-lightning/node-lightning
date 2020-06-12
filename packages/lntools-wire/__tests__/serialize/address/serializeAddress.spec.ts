import { expect } from "chai";
import { serializeAddress as sut } from "../../../lib/serialize/address/serializeAddress";

import { Address } from "../../../lib";
import { AddressIPv4 } from "../../../lib/domain/AddressIPv4";
import { AddressIPv6 } from "../../../lib/domain/AddressIPv6";
import { AddressTor2 } from "../../../lib/domain/AddressTor2";
import { AddressTor3 } from "../../../lib/domain/AddressTor3";

const tests: Array<[string, Address, Buffer]> = [
  [
    "IPv4 loopback address",
    new AddressIPv4("127.0.0.1", 9735),
    Buffer.from([1, 127, 0, 0, 1, 38, 7]),
  ],
  [
    "IPv4 address",
    new AddressIPv4("38.87.54.163", 9735),
    Buffer.from([1, 38, 87, 54, 163, 38, 7]),
  ],
  [
    "IPv6 loopback address",
    new AddressIPv6("::1", 9735),
    Buffer.from("02000000000000000000000000000000012607", "hex"),
  ],
  [
    "IPv6 address",
    new AddressIPv6("2604:a880:2:d0::219c:c001", 9735),
    Buffer.from("022604a880000200d000000000219cc0012607", "hex"),
  ],
  [
    "Tor 2 address",
    new AddressTor2("qxgtzlxgebngzqtg.onion", 9735),
    Buffer.from("0385cd3caee6205a6cc2662607", "hex"),
  ],
  [
    "Tor 3 address",
    new AddressTor3("ueo7nndq5jnsc3gg3fpnrj3v6ceedvrej5qr5lt6ppvrtd7xxk64qiid.onion", 9735),
    Buffer.from("04a11df6b470ea5b216cc6d95ed8a775f08841d6244f611eae7e7beb198ff7babdc821032607", "hex"),
  ],
]; // prettier-ignore

describe("serializeAddress", () => {
    for (const [title, input, expected] of tests) {
        it(title, () => {
            const actual = sut(input);
            expect(actual).to.deep.equal(expected);
        });
    }
});
