import { expect } from "chai";
import { HashByteOrder } from "../lib/HashByteOrder";
import { HashValue } from "../lib/HashValue";
import { OutPoint } from "../lib/OutPoint";

describe("OutPoint", () => {
    const hashValue = HashValue.fromRpc(
        "dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd",
    );
    describe("constructor", () => {
        it("should include txid", () => {
            const result = new OutPoint(hashValue, 0);
            expect(result.txid.toString(HashByteOrder.RPC)).to.equal(
                "dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd",
            );
        });

        it("should include output index", () => {
            const result = new OutPoint(hashValue, 0);
            expect(result.outputIndex).to.equal(0);
        });
    });

    describe(".toString()", () => {
        it("should concatinate txId:voutIdx", () => {
            const sut = new OutPoint(hashValue, 0);
            const actual = sut.toString();
            expect(actual).to.equal(
                "dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd:0",
            );
        });
    });

    describe(".clone()", () => {
        it("should deep copy", () => {
            const a = new OutPoint(hashValue, 0);
            const b = a.clone();
            expect(a).to.not.equal(b);
            expect(a.txid).to.not.equal(b.txid);
            expect(a.txid.toString()).to.equal(b.txid.toString());
            expect(a.outputIndex).to.equal(b.outputIndex);
        });
    });

    describe(".eq()", () => {
        it("returns false when other is undefined", () => {
            const a = OutPoint.fromString(
                "0000000000000000000000000000000000000000000000000000000000000001:0",
            );
            const b: OutPoint = undefined;
            expect(a.eq(b)).to.equal(false);
        });

        it("returns false when txid is different", () => {
            const a = OutPoint.fromString(
                "0000000000000000000000000000000000000000000000000000000000000001:0",
            );
            const b = OutPoint.fromString(
                "0000000000000000000000000000000000000000000000000000000000000002:0",
            );
            expect(a.eq(b)).to.equal(false);
        });

        it("returns false when output index is different", () => {
            const a = OutPoint.fromString(
                "0000000000000000000000000000000000000000000000000000000000000001:0",
            );
            const b = OutPoint.fromString(
                "0000000000000000000000000000000000000000000000000000000000000001:1",
            );
            expect(a.eq(b)).to.equal(false);
        });

        it("returns true when both are equal", () => {
            const a = OutPoint.fromString(
                "0000000000000000000000000000000000000000000000000000000000000001:0",
            );
            const b = OutPoint.fromString(
                "0000000000000000000000000000000000000000000000000000000000000001:0",
            );
            expect(a.eq(b)).to.equal(true);
        });
    });

    describe("coinbase", () => {
        it("returns the coinbase outpoint", () => {
            const a = OutPoint.fromString(
                "0000000000000000000000000000000000000000000000000000000000000000:4294967295",
            );
            expect(OutPoint.coinbase.eq(a));
        });
    });
});
