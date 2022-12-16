import { expect } from "chai";
import { OutPoint } from "@node-lightning/bitcoin";
import { ChannelId } from "../../lib/domain/ChannelId";

describe("ChannelId", () => {
    describe("#fromOutPoint()", () => {
        it("fails with out of range output index", () => {
            const outpoint = OutPoint.fromString("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:65536"); // prettier-ignore
            expect(() => ChannelId.fromOutPoint(outpoint)).to.throw();
        });

        it("simple example", () => {
            const outpoint = OutPoint.fromString("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:0"); // prettier-ignore
            const sut = ChannelId.fromOutPoint(outpoint);
            expect(sut.toHex()).to.equal("5110a1662954d8d85450b2599c213f06efbb28aff25ef5cba1b96e12b640a009"); // prettier-ignore
        });

        it("lower byte example", () => {
            const outpoint = OutPoint.fromString("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:255"); // prettier-ignore
            const sut = ChannelId.fromOutPoint(outpoint);
            expect(sut.toHex()).to.equal("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff"); // prettier-ignore
        });

        it("upper byte example", () => {
            const outpoint = OutPoint.fromString("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:65280"); // prettier-ignore
            const sut = ChannelId.fromOutPoint(outpoint);
            expect(sut.toHex()).to.equal("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00"); // prettier-ignore
        });

        it("two bytes example", () => {
            const outpoint = OutPoint.fromString("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:65535"); // prettier-ignore
            const sut = ChannelId.fromOutPoint(outpoint);
            expect(sut.toHex()).to.equal("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000"); // prettier-ignore
        });

        it("fails on overflow", () => {
            const outpoint = OutPoint.fromString("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:65536"); // prettier-ignore
            expect(() => ChannelId.fromOutPoint(outpoint)).to.throw();
        });
    });

    describe(".toBuffer()", () => {
        it("outputs the buffer", () => {
            const sut = ChannelId.fromOutPoint(OutPoint.fromString("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:0")); // prettier-ignore
            expect(sut.toBuffer()).to.deep.equal(Buffer.from("5110a1662954d8d85450b2599c213f06efbb28aff25ef5cba1b96e12b640a009", "hex")); // prettier-ignore
        });
    });

    describe(".toString()", () => {
        it("outputs the hex string", () => {
            const sut = ChannelId.fromOutPoint(OutPoint.fromString("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:0")); // prettier-ignore
            expect(sut.toString()).to.equal("5110a1662954d8d85450b2599c213f06efbb28aff25ef5cba1b96e12b640a009"); // prettier-ignore
        });
    });

    describe(".toHex()", () => {
        it("outputs the hex string", () => {
            const sut = ChannelId.fromOutPoint(OutPoint.fromString("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:0")); // prettier-ignore
            expect(sut.toHex()).to.equal("5110a1662954d8d85450b2599c213f06efbb28aff25ef5cba1b96e12b640a009"); // prettier-ignore
        });
    });

    describe(".equals()", () => {
        it("true when byte-wise equal", () => {
            const a = ChannelId.fromOutPoint(OutPoint.fromString("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:0")); // prettier-ignore
            const b = ChannelId.fromOutPoint(OutPoint.fromString("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:0")); // prettier-ignore
            expect(a.equals(b)).to.equal(true);
        });

        it("false when different txid", () => {
            const a = ChannelId.fromOutPoint(OutPoint.fromString("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:0")); // prettier-ignore
            const b = ChannelId.fromOutPoint(OutPoint.fromString("08a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:0")); // prettier-ignore
            expect(a.equals(b)).to.equal(false);
        });

        it("false when different index", () => {
            const a = ChannelId.fromOutPoint(OutPoint.fromString("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:0")); // prettier-ignore
            const b = ChannelId.fromOutPoint(OutPoint.fromString("09a040b6126eb9a1cbf55ef2af28bbef063f219c59b25054d8d8542966a11051:1")); // prettier-ignore
            expect(a.equals(b)).to.equal(false);
        });
    });
});
