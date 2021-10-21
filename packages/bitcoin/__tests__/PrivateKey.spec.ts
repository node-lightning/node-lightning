import { expect } from "chai";
import { Network } from "../lib/Network";
import { PrivateKey } from "../lib/PrivateKey";

describe("PrivateKey", () => {
    let sut: PrivateKey;

    beforeEach(() => {
        const buf = Buffer.alloc(32, 1);
        sut = new PrivateKey(buf, Network.mainnet);
    });

    it("throws on value too low", () => {
        expect(() => new PrivateKey(Buffer.alloc(32), Network.mainnet)).to.throw();
    });

    it("throws on value too high", () => {
        expect(() => new PrivateKey(Buffer.alloc(32, 0xff), Network.mainnet)).to.throw();
    });

    it("throws on invalid length value", () => {
        expect(() => new PrivateKey(Buffer.alloc(16, 0x01), Network.mainnet)).to.throw();
    });

    describe("toPubKey()", () => {
        it("creates a valid pubkey", () => {
            const result = sut.toPubKey();
            expect(result.toHex(true)).to.equal(
                "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
            );
        });

        it("maintains the network", () => {
            const result = sut.toPubKey();
            expect(result.network).to.equal(sut.network);
        });
    });

    describe(".toBuffer()", () => {
        it("outputs raw value", () => {
            expect(sut.toBuffer().toString("hex")).to.equal(
                "0101010101010101010101010101010101010101010101010101010101010101",
            );
        });
    });

    describe(".toHex()", () => {
        it("outputs raw value", () => {
            expect(sut.toHex()).to.equal(
                "0101010101010101010101010101010101010101010101010101010101010101",
            );
        });
    });

    describe(".tweakAdd()", () => {
        it("adds identity to private key", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex"); // prettier-ignore
            const result = sut.tweakAdd(tweak);
            expect(result.toHex()).to.equal(
                "0101010101010101010101010101010101010101010101010101010101010101",
            );
        });

        it("adds tweak to private key", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakAdd(tweak);
            expect(result.toHex()).to.equal(
                "0101010101010101010101010101010101010101010101010101010101010102",
            );
        });

        it("maintains the same network", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakAdd(tweak);
            expect(sut.network).to.equal(result.network);
        });

        it("creates a new instance", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakAdd(tweak);
            expect(result).to.not.equal(sut);
        });
    });

    describe(".tweakMul()", () => {
        it("multiplies by identity", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakMul(tweak);
            expect(result.toHex()).to.equal(
                "0101010101010101010101010101010101010101010101010101010101010101",
            );
        });

        it("multiplies by a tweak", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000002", "hex"); // prettier-ignore
            const result = sut.tweakMul(tweak);
            expect(result.toHex()).to.equal(
                "0202020202020202020202020202020202020202020202020202020202020202",
            );
        });

        it("maintains the same network", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakMul(tweak);
            expect(sut.network).to.equal(result.network);
        });

        it("creates a new instance", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakMul(tweak);
            expect(result).to.not.equal(sut);
        });
    });
});
