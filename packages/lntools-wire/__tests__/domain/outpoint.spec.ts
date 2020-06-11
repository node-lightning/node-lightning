import { expect } from "chai";
import { OutPoint } from "../../lib/domain/OutPoint";

describe("OutPoint", () => {
    describe("constructor", () => {
        it("should include txId", () => {
            const result = new OutPoint(
                "dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd",
                0,
            );
            expect(result.txId).to.equal(
                "dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd",
            );
        });

        it("should include voutIdx", () => {
            const result = new OutPoint(
                "dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd",
                0,
            );
            expect(result.voutIdx).to.equal(0);
        });
    });

    describe(".toString()", () => {
        it("should concatinate txId:voutIdx", () => {
            const sut = new OutPoint(
                "dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd",
                0,
            );
            const actual = sut.toString();
            expect(actual).to.equal(
                "dafb459ccece105609ed7fd63a515ce9df0d3c02fb05ebeffe28c2899b60a5fd:0",
            );
        });
    });
});
