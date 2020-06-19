import { expect } from "chai";
import { encodeVarInt } from "../lib/encodeVarInt";

describe("Varint", () => {
    const tests: Array<[Buffer, bigint]> = [
        [Buffer.from("00", "hex"), BigInt(0x00)],
        [Buffer.from("01", "hex"), BigInt(0x01)],
        [Buffer.from("fc", "hex"), BigInt(0xfc)],
        [Buffer.from("fd0001", "hex"), BigInt(0x0100)],
        [Buffer.from("fdffff", "hex"), BigInt(0xffff)],
        [Buffer.from("fe00000001", "hex"), BigInt(0x01000000)],
        [Buffer.from("feffffffff", "hex"), BigInt(0xffffffff)],
        [Buffer.from("ff0000000000000001", "hex"), BigInt("0x0100000000000000")],
        [Buffer.from("ffffffffffffffffff", "hex"), BigInt("0xffffffffffffffff")],
    ];

    describe("encodeVarint", () => {
        for (const test of tests) {
            it(`${test[1]} => 0x${test[0].toString("hex")}`, () => {
                const actual = encodeVarInt(test[1]);
                expect(actual.toString("hex")).to.equal(test[0].toString("hex"));
            });
        }
    });
});
