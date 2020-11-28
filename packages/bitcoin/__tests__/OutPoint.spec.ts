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
});
