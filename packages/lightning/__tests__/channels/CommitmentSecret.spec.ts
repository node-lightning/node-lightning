import { Network, PrivateKey } from "@node-lightning/bitcoin";
import { expect } from "chai";
import { CommitmentSecret } from "../../lib/channels/CommitmentSecret";

describe("CommitmentSecret", () => {
    describe("#commitmentSecret()", () => {
        const tests = [
            {
                name: "0 final node",
                seed: "0000000000000000000000000000000000000000000000000000000000000000",
                i: 281474976710655n,
                expected: "02a40c85b6f28da08dfdbe0926c53fab2de6d28c10301f8f7c4073d5e42e3148",
            },
            {
                name: "FF final node",
                seed: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
                i: 281474976710655n,
                expected: "7cc854b54e3e0dcdb010d7a3fee464a9687be6e8db3be6854c475621e007a5dc",
            },
            {
                name: "FF alternate bits 1",
                seed: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
                i: 0xaaaaaaaaaaan,
                expected: "56f4008fb007ca9acf0e15b054d5c9fd12ee06cea347914ddbaed70d1c13a528",
            },
            {
                name: "FF alternate bits 2",
                seed: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
                i: 0x555555555555n,
                expected: "9015daaeb06dba4ccc05b91b2f73bd54405f2be9f217fbacd3c5ac2e62327d31",
            },
            {
                name: "01 last nontrivial node",
                seed: "0101010101010101010101010101010101010101010101010101010101010101",
                i: 1n,
                expected: "915c75942a26bb3a433a8ce2cb0427c29ec6c1775cfc78328b57f6ba7bfeaa9c",
            },
        ];

        for (const test of tests) {
            it(test.name, () => {
                const seed = Buffer.from(test.seed, "hex");
                const actual = CommitmentSecret.derive(seed, test.i);
                expect(actual.toString("hex")).to.deep.equal(test.expected);
            });
        }
    });
});
