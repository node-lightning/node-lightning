import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { OpCode } from "../lib/OpCodes";
import { Script } from "../lib/Script";
import { TxOut } from "../lib/TxOut";
import { Value } from "../lib/Value";

describe("TxOut", () => {
    describe("#parse()", () => {
        it("parses", () => {
            const sr = StreamReader.fromHex(
                "60ea00000000000017a914010101010101010101010101010101010101010187",
            );
            const sut = TxOut.parse(sr);
            expect(Number(sut.value.sats)).to.equal(60000);
            expect(
                sut.scriptPubKey.equals(
                    new Script(OpCode.OP_HASH160, Buffer.alloc(20, 1), OpCode.OP_EQUAL),
                ),
            ).to.equal(true);
        });
    });

    describe(".serialize()", () => {
        it("serializes", () => {
            const sut = new TxOut(
                Value.fromSats(60000),
                new Script(OpCode.OP_HASH160, Buffer.alloc(20, 1), OpCode.OP_EQUAL),
            );
            expect(sut.serialize().toString("hex")).to.equal(
                "60ea00000000000017a914010101010101010101010101010101010101010187",
            );
        });
    });

    describe(".toString()", () => {
        it("returns a string", () => {
            const sut = new TxOut(
                Value.fromSats(60000),
                new Script(OpCode.OP_HASH160, Buffer.alloc(20, 1), OpCode.OP_EQUAL),
            );
            const actual = sut.toString();
            expect(actual).to.equal(
                'value="60000", scriptPubKey="OP_HASH160 0101010101010101010101010101010101010101 OP_EQUAL"',
            );
        });
    });

    describe(".toJSON()", () => {
        it("returns an object", () => {
            const sut = new TxOut(
                Value.fromSats(60000),
                new Script(OpCode.OP_HASH160, Buffer.alloc(20, 1), OpCode.OP_EQUAL),
            );
            const actual = sut.toJSON();
            expect(actual.value).to.equal("60000");
            expect(actual.scriptPubKey).to.equal(
                "OP_HASH160 0101010101010101010101010101010101010101 OP_EQUAL",
            );
        });
    });

    describe(".clone()", () => {
        it("clones via deep copy", () => {
            const a = new TxOut(
                Value.fromSats(60000),
                new Script(OpCode.OP_HASH160, Buffer.alloc(20, 1), OpCode.OP_EQUAL),
            );
            const b = a.clone();
            expect(b).to.not.equal(a);
            expect(b.value).to.not.equal(a.value);
            expect(b.scriptPubKey).to.not.equal(a.scriptPubKey);
            expect(b.serialize()).to.deep.equal(a.serialize());
        });
    });
});
