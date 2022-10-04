import { expect } from "chai";
import { Bits } from "../lib/Bits";

describe(Bits.name, () => {
    describe(Bits.fromBuffer.name, () => {
        it("genesis block", () => {
            const buf = Buffer.from("ffff001d", "hex");
            const result = Bits.fromBuffer(buf);
            expect(result.coefficient).to.equal(65535);
            expect(result.exponent).to.equal(29);
        });

        it("block 757089", () => {
            const buf = Buffer.from("aef90817", "hex");
            const result = Bits.fromBuffer(buf);
            expect(result.coefficient).to.equal(588206);
            expect(result.exponent).to.equal(23);
        });
    });

    describe(".target", () => {
        it("genesis block", () => {
            const sut = new Bits(65535, 29);
            expect(sut.target).to.equal(
                26959535291011309493156476344723991336010898738574164086137773096960n,
            );
        });

        it("block 757089", () => {
            const sut = new Bits(588206, 23);
            expect(sut.target).to.equal(859664032087861081904916640712713969859737457373741056n);
        });
    });

    describe(".difficulty", () => {
        it("genesis block", () => {
            const sut = new Bits(65535, 29);
            expect(sut.difficulty).to.equal(1n);
        });

        it("block 757089", () => {
            const sut = new Bits(588206, 23);
            expect(sut.difficulty).to.equal(31360548173144n);
        });
    });
});
