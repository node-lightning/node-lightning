import { expect } from "chai";
import { Value } from "../lib/Value";

describe("Value", () => {
    it("#fromBitcoin()", () => {
        expect(Value.fromBitcoin(0.00000001).bitcoin).to.equal(0.00000001);
        expect(Value.fromBitcoin(0.12345678).bitcoin).to.equal(0.12345678);
        expect(Value.fromBitcoin(1).bitcoin).to.equal(1);
        expect(Value.fromBitcoin(1.23).bitcoin).to.equal(1.23);
        expect(Value.fromBitcoin(20000000.00000008).bitcoin).to.equal(20000000.00000008);
    });

    it("#fromSats()", () => {
        expect(Value.fromSats(1).psats.toString()).to.equal("1000000000000");
        expect(Value.fromSats(12345678).psats.toString()).to.equal("12345678000000000000");
    });

    it("#fromMilliSats()", () => {
        expect(Value.fromMilliSats(1).psats.toString()).to.equal("1000000000");
        expect(Value.fromMilliSats(12345678123).psats.toString()).to.equal("12345678123000000000");
    });

    it("#fromMicroSats()", () => {
        expect(Value.fromMicroSats(1).psats.toString()).to.equal("1000000");
        expect(Value.fromMicroSats(12345678123456).psats.toString()).to.equal(
            "12345678123456000000",
        );
    });

    it("#fromPicoSats()", () => {
        expect(Value.fromPicoSats(1).psats.toString()).to.equal("1");
        expect(Value.fromPicoSats(BigInt("12345678123456123456")).psats.toString()).to.equal(
            "12345678123456123456",
        );
    });

    it(".bitcoin", () => {
        expect(Value.fromBitcoin(1).bitcoin).to.equal(1);
        expect(Value.fromBitcoin(1.12345678).bitcoin).to.equal(1.12345678);
        expect(Value.fromSats(1).bitcoin).to.equal(0.00000001);
        expect(Value.fromSats(12345678).bitcoin).to.equal(0.12345678);
        expect(Value.fromSats(112345678).bitcoin).to.equal(1.12345678);
        expect(Value.fromSats(112345678).bitcoin).to.equal(1.12345678);
        expect(Value.fromMilliSats(1).bitcoin).to.equal(0.0);
        expect(Value.fromMilliSats(1000).bitcoin).to.equal(0.00000001);
        expect(Value.fromMilliSats(1234).bitcoin).to.equal(0.00000001);
        expect(Value.fromPicoSats(1).bitcoin).to.equal(0.0);
        expect(Value.fromPicoSats(1000).bitcoin).to.equal(0.0);
        expect(Value.fromPicoSats(1000000).bitcoin).to.equal(0.0);
        expect(Value.fromPicoSats(1000000000).bitcoin).to.equal(0.0);
        expect(Value.fromPicoSats(1000000000000).bitcoin).to.equal(0.00000001);
    });

    it(".sats", () => {
        expect(Value.fromBitcoin(1).sats.toString()).to.equal("100000000");
        expect(Value.fromBitcoin(1.12345678).sats.toString()).to.equal("112345678");
        expect(Value.fromSats(1).sats.toString()).to.equal("1");
        expect(Value.fromSats(12345678).sats.toString()).to.equal("12345678");
        expect(Value.fromSats(112345678).sats.toString()).to.equal("112345678");
        expect(Value.fromSats(112345678).sats.toString()).to.equal("112345678");
        expect(Value.fromMilliSats(1).sats.toString()).to.equal("0");
        expect(Value.fromMilliSats(1000).sats.toString()).to.equal("1");
        expect(Value.fromMilliSats(1234).sats.toString()).to.equal("1");
        expect(Value.fromPicoSats(1).sats.toString()).to.equal("0");
        expect(Value.fromPicoSats(1000).sats.toString()).to.equal("0");
        expect(Value.fromPicoSats(1000000).sats.toString()).to.equal("0");
        expect(Value.fromPicoSats(1000000000).sats.toString()).to.equal("0");
        expect(Value.fromPicoSats(1000000000000).sats.toString()).to.equal("1");
    });

    it(".msats", () => {
        expect(Value.fromBitcoin(1).msats.toString()).to.equal("100000000000");
        expect(Value.fromBitcoin(1.12345678).msats.toString()).to.equal("112345678000");
        expect(Value.fromSats(1).msats.toString()).to.equal("1000");
        expect(Value.fromSats(12345678).msats.toString()).to.equal("12345678000");
        expect(Value.fromSats(112345678).msats.toString()).to.equal("112345678000");
        expect(Value.fromSats(112345678).msats.toString()).to.equal("112345678000");
        expect(Value.fromMilliSats(1).msats.toString()).to.equal("1");
        expect(Value.fromMilliSats(1000).msats.toString()).to.equal("1000");
        expect(Value.fromMilliSats(1234).msats.toString()).to.equal("1234");
        expect(Value.fromPicoSats(1).msats.toString()).to.equal("0");
        expect(Value.fromPicoSats(1000).msats.toString()).to.equal("0");
        expect(Value.fromPicoSats(1000000).msats.toString()).to.equal("0");
        expect(Value.fromPicoSats(1000000000).msats.toString()).to.equal("1");
        expect(Value.fromPicoSats(1000000000000).msats.toString()).to.equal("1000");
    });

    it(".microsats", () => {
        expect(Value.fromBitcoin(1).microsats.toString()).to.equal("100000000000000");
        expect(Value.fromBitcoin(1.12345678).microsats.toString()).to.equal("112345678000000");
        expect(Value.fromSats(1).microsats.toString()).to.equal("1000000");
        expect(Value.fromSats(12345678).microsats.toString()).to.equal("12345678000000");
        expect(Value.fromSats(112345678).microsats.toString()).to.equal("112345678000000");
        expect(Value.fromSats(112345678).microsats.toString()).to.equal("112345678000000");
        expect(Value.fromMilliSats(1).microsats.toString()).to.equal("1000");
        expect(Value.fromMilliSats(1000).microsats.toString()).to.equal("1000000");
        expect(Value.fromMilliSats(1234).microsats.toString()).to.equal("1234000");
        expect(Value.fromPicoSats(1).microsats.toString()).to.equal("0");
        expect(Value.fromPicoSats(1000).microsats.toString()).to.equal("0");
        expect(Value.fromPicoSats(1000000).microsats.toString()).to.equal("1");
        expect(Value.fromPicoSats(1000000000).microsats.toString()).to.equal("1000");
        expect(Value.fromPicoSats(1000000000000).microsats.toString()).to.equal("1000000");
    });

    describe(".clone()", () => {
        it("clones via deep copy", () => {
            const a = Value.fromBitcoin(1);
            const b = a.clone();
            expect(a).to.not.equal(b);
            expect(b.bitcoin).to.equal(a.bitcoin);
        });
    });

    describe(".eq()", () => {
        it("true when equal", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(1);
            expect(a.eq(b)).to.equal(true);
        });

        it("false when not equal", () => {
            const a = Value.fromBitcoin(1.00000001);
            const b = Value.fromBitcoin(1);
            expect(a.eq(b)).to.equal(false);
        });
    });

    describe(".gt()", () => {
        it("true when greater", () => {
            const a = Value.fromBitcoin(2);
            const b = Value.fromBitcoin(1);
            expect(a.gt(b)).to.equal(true);
        });

        it("false when equal", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(1);
            expect(a.gt(b)).to.equal(false);
        });

        it("false when less", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(2);
            expect(a.gt(b)).to.equal(false);
        });
    });

    describe(".gte()", () => {
        it("true when greater", () => {
            const a = Value.fromBitcoin(2);
            const b = Value.fromBitcoin(1);
            expect(a.gte(b)).to.equal(true);
        });

        it("true when equal", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(1);
            expect(a.gte(b)).to.equal(true);
        });

        it("false when less", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(2);
            expect(a.gte(b)).to.equal(false);
        });
    });

    describe(".lt()", () => {
        it("false when greater", () => {
            const a = Value.fromBitcoin(2);
            const b = Value.fromBitcoin(1);
            expect(a.lt(b)).to.equal(false);
        });

        it("false when equal", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(1);
            expect(a.lt(b)).to.equal(false);
        });

        it("true when less", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(2);
            expect(a.lt(b)).to.equal(true);
        });
    });

    describe(".lte()", () => {
        it("false when greater", () => {
            const a = Value.fromBitcoin(2);
            const b = Value.fromBitcoin(1);
            expect(a.lte(b)).to.equal(false);
        });

        it("true when equal", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(1);
            expect(a.lte(b)).to.equal(true);
        });

        it("true when less", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(2);
            expect(a.lte(b)).to.equal(true);
        });
    });

    describe(".add()", () => {
        it("adds the supplied value", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromSats(1);
            a.add(b);
            expect(a.bitcoin).to.equal(1.00000001);
        });
        it("is fluent", () => {
            const sut = Value.zero().add(Value.fromSats(1000)).add(Value.fromSats(400));
            expect(sut.sats).to.equal(1400n);
        });
    });

    describe(".sub()", () => {
        it("subtracts the suplied value", () => {
            const a = Value.fromBitcoin(1.000000001);
            const b = Value.fromBitcoin(0.000000001);
            a.sub(b);
            expect(a.bitcoin).to.equal(1);
        });

        it("throws when underflow", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(1.1);
            expect(() => a.sub(b)).to.throw("Value underflow");
        });

        it("is fluent", () => {
            const sut = Value.fromSats(1000).sub(Value.fromSats(400));
            expect(sut.sats).to.equal(600n);
        });
    });

    describe(".addn()", () => {
        it("adds the supplied value", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromSats(1);
            const c = a.addn(b);
            expect(c.bitcoin).to.equal(1.00000001);
            expect(c).to.not.equal(a);
        });
        it("is fluent", () => {
            const sut = Value.zero().addn(Value.fromSats(1000)).addn(Value.fromSats(400));
            expect(sut.sats).to.equal(1400n);
        });
    });

    describe(".subn()", () => {
        it("subtracts the suplied value", () => {
            const a = Value.fromBitcoin(1.000000001);
            const b = Value.fromBitcoin(0.000000001);
            const c = a.subn(b);
            expect(c.bitcoin).to.equal(1);
            expect(c).to.not.equal(a);
        });

        it("throws when underflow", () => {
            const a = Value.fromBitcoin(1);
            const b = Value.fromBitcoin(1.1);
            expect(() => a.subn(b)).to.throw("Value underflow");
        });

        it("is fluent", () => {
            const sut = Value.fromSats(1000).subn(Value.fromSats(400));
            expect(sut.sats).to.equal(600n);
        });
    });

    describe(".toString()", () => {
        it("when zero", () => {
            expect(Value.fromBitcoin(0).toString()).to.equal("0.00000000");
        });

        it("when bitcoin", () => {
            expect(Value.fromBitcoin(1.12345678).toString()).to.equal("1.12345678");
        });

        it("when satoshis", () => {
            expect(Value.fromSats(1).toString()).to.equal("0.00000001");
        });

        it("when millisats", () => {
            expect(Value.fromMilliSats(1).toString()).to.equal("0.00000000");
        });
    });
});
