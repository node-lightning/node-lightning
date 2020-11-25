import { expect } from "chai";
import { Value } from "../lib/Value";

describe("Value", () => {
    it("#fromBitcoin()", () => {
        expect(Value.fromBitcoin(0.00000001).bitcoin).to.equal(0.00000001);
        expect(Value.fromBitcoin(0.12345678).bitcoin).to.equal(0.12345678);
        expect(Value.fromBitcoin(1).bitcoin).to.equal(1);
        expect(Value.fromBitcoin(1.23).bitcoin).to.equal(1.23);
    });

    it("#fromSats()", () => {
        expect(Value.fromSats(1).psats.toString()).to.equal("1000000000000");
        expect(Value.fromSats(12345678).psats.toString()).to.equal("12345678000000000000");
    });

    it("#fromMilliSats()", () => {
        expect(Value.fromMilliSats(1).psats.toString()).to.equal("1000000000");
        expect(Value.fromMilliSats(12345678123).psats.toString()).to.equal("12345678123000000000");
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
});
