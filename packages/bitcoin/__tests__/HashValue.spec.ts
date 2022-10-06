import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { HashByteOrder } from "../lib/HashByteOrder";
import { HashValue } from "../lib/HashValue";

describe("HashValue", () => {
    describe("#parseRpcOrder()", () => {
        it("throws when short", () => {
            const sr = StreamReader.fromHex(
                "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce2",
            );
            expect(() => HashValue.fromRpcStream(sr)).to.throw();
        });
        it("parses value", () => {
            const sr = StreamReader.fromHex(
                "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
            );
            const val = HashValue.fromRpcStream(sr);
            expect(val.toString()).to.equal(
                "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
            );
        });
    });

    describe("#parse()", () => {
        it("throw when short", () => {
            const sr = StreamReader.fromHex(
                "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d61900000000",
            );
            expect(() => HashValue.parse(sr)).to.throw();
        });
        it("parses value", () => {
            const sr = StreamReader.fromHex(
                "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
            );
            const val = HashValue.parse(sr);
            expect(val.toString()).to.equal(
                "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
            );
        });
    });

    describe(".toString()", () => {
        it("returns RPC byte order", () => {
            const val = new HashValue(
                Buffer.from(
                    "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
                    "hex",
                ),
            );
            expect(val.toString()).to.equal(
                "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
            );
        });
    });

    describe(".toJSON()", () => {
        it("returns RPC byte order", () => {
            const val = new HashValue(
                Buffer.from(
                    "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
                    "hex",
                ),
            );
            expect(val.toJSON()).to.equal(
                "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
            );
        });
    });

    describe(".serialize()", () => {
        it("serializes to internal byte order", () => {
            const val = new HashValue(
                Buffer.from(
                    "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
                    "hex",
                ),
            );
            expect(val.serialize().toString("hex")).to.equal(
                "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
            );
        });
        it("serializes to RPC byte order", () => {
            const val = new HashValue(
                Buffer.from(
                    "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
                    "hex",
                ),
            );
            expect(val.serialize(HashByteOrder.RPC).toString("hex")).to.equal(
                "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
            );
        });
    });

    describe(".clone()", () => {
        it("performs deep copy", () => {
            const a = new HashValue(Buffer.alloc(32, 0x01));
            const b = a.clone();
            expect(a).to.not.equal(b);
            expect((a as any)._value).to.not.equal((b as any)._value);
        });
    });

    describe(".eq()", () => {
        it("false other is undefined", () => {
            const a = new HashValue(Buffer.from([1, 2, 3]));
            const b = undefined;
            expect(a.eq(b)).to.equal(false);
        });
        it("false when unequal length", () => {
            const a = new HashValue(Buffer.from([1, 2, 3]));
            const b = new HashValue(Buffer.from([1, 2]));
            expect(a.eq(b)).to.equal(false);
        });

        it("false when not same value", () => {
            const a = new HashValue(Buffer.from([1, 2, 3]));
            const b = new HashValue(Buffer.from([1, 2, 4]));
            expect(a.eq(b)).to.equal(false);
        });

        it("true when same value", () => {
            const a = new HashValue(Buffer.from([1, 2, 3]));
            const b = new HashValue(Buffer.from([1, 2, 3]));
            expect(a.eq(b)).to.equal(true);
        });
    });
});
