import { expect } from "chai";
import { CommitmentSecret } from "../../lib/lightning/CommitmentSecret";

describe("CommitmentSecret", () => {
    describe("#commitmentSecret()", () => {
        let tests = [
            {
                name: "0 final node",
                seed: "0000000000000000000000000000000000000000000000000000000000000000",
                i: BigInt(281474976710655),
                expected: "02a40c85b6f28da08dfdbe0926c53fab2de6d28c10301f8f7c4073d5e42e3148",
            },
            {
                name: "FF final node",
                seed: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
                i: BigInt(281474976710655),
                expected: "7cc854b54e3e0dcdb010d7a3fee464a9687be6e8db3be6854c475621e007a5dc",
            },
            {
                name: "FF alternate bits 1",
                seed: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
                i: BigInt(0xaaaaaaaaaaa),
                expected: "56f4008fb007ca9acf0e15b054d5c9fd12ee06cea347914ddbaed70d1c13a528",
            },
            {
                name: "FF alternate bits 2",
                seed: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
                i: BigInt(0x555555555555),
                expected: "9015daaeb06dba4ccc05b91b2f73bd54405f2be9f217fbacd3c5ac2e62327d31",
            },
            {
                name: "01 last nontrivial node",
                seed: "0101010101010101010101010101010101010101010101010101010101010101",
                i: BigInt(1),
                expected: "915c75942a26bb3a433a8ce2cb0427c29ec6c1775cfc78328b57f6ba7bfeaa9c",
            },
        ];

        for (let test of tests) {
            it(test.name, () => {
                let actual = CommitmentSecret.derive(Buffer.from(test.seed, "hex"), test.i);
                expect(actual).to.deep.equal(Buffer.from(test.expected, "hex"));
            });
        }
    });
});
