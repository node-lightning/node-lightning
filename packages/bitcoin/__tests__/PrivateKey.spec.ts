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

    describe(".fromWif()", () => {
        it("returns private key and compressed public key", () => {
            const [prv, pub] = PrivateKey.fromWif("cMahea7zqjxrtgAbB7LSGbcQUr1uX1ojuat9jZodMN8rFTv2sfUK"); // prettier-ignore
            expect(prv.toHex()).to.equal("000000000000000000000000000000000000000000000000000000000000138b"); // prettier-ignore
            expect(pub.compressed).to.equal(true);
            expect(pub.toHex()).to.equal("024f9b48f0ae9df11070c4c5ae2b012cd64599063e5bd32b5443548b786a06db2a"); // prettier-ignore
        });

        it("returns private key and uncompressed public key", () => {
            const [prv, pub] = PrivateKey.fromWif("91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjpWAxgzczjbCwxic"); // prettier-ignore
            expect(prv.toHex()).to.equal("0000000000000000000000000000000000000000000000000077c8350c02b595"); // prettier-ignore
            expect(pub.compressed).to.equal(false);
            expect(pub.toHex()).to.equal("041d19a0e39a4e089c8473df05f305b6c936f19219a8c708218b143f01a633514771a1eeefb15ab6b1aa4540dd09b11e8f74d80e845765faddd53350270fde33de"); // prettier-ignore
        });
    });

    describe(".toPubKey()", () => {
        it("creates a valid pubkey", () => {
            const result = sut.toPubKey(true);
            expect(result.toHex()).to.equal(
                "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
            );
        });

        it("maintains the network", () => {
            const result = sut.toPubKey(true);
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

    describe(".toWif()", () => {
        it("outputs compressed WIF", () => {
            expect(sut.toWif(true)).to.equal(
                "KwFfNUhSDaASSAwtG7ssQM1uVX8RgX5GHWnnLfhfiQDigjioWXHH",
            );
        });
        it("outputs uncompressed WIF", () => {
            expect(sut.toWif(false)).to.equal(
                "5HpjE2Hs7vjU4SN3YyPQCdhzCu92WoEeuE6PWNuiPyTu3ESGnzn",
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

        it("throws with invalid tweak", () => {
            const sut = new PrivateKey(Buffer.from("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140", "hex"), Network.mainnet); // prettier-ignore
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            expect(() => sut.tweakAdd(tweak)).to.throw(
                "The tweak was out of range or the resulted private key is invalid",
            );
        });

        it("throws with out of range tweak", () => {
            const tweak = Buffer.from("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", "hex"); // prettier-ignore
            expect(() => sut.tweakAdd(tweak)).to.throw(
                "The tweak was out of range or the resulted private key is invalid",
            );
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

        it("tweak wraps invalid private key", () => {
            const sut = new PrivateKey(Buffer.from("7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a1", "hex"), Network.mainnet); // prettier-ignore
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000002", "hex"); // prettier-ignore
            const result = sut.tweakMul(tweak);
            expect(result.toHex()).to.equal(
                "0000000000000000000000000000000000000000000000000000000000000001",
            );
        });

        it("throws with out of range tweak", () => {
            const tweak = Buffer.from("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", "hex"); // prettier-ignore
            expect(() => sut.tweakMul(tweak)).to.throw(
                "The tweak was out of range or equal to zero",
            );
        });
    });

    describe(".equals()", () => {
        it("returns false when different networks", () => {
            const a = new PrivateKey(Buffer.alloc(32, 0x1), Network.mainnet);
            const b = new PrivateKey(Buffer.alloc(32, 0x1), Network.testnet);
            expect(a.equals(b)).to.equal(false);
        });

        it("returns false when different values", () => {
            const a = new PrivateKey(Buffer.alloc(32, 0x1), Network.mainnet);
            const b = new PrivateKey(Buffer.alloc(32, 0x2), Network.mainnet);
            expect(a.equals(b)).to.equal(false);
        });

        it("returns true when both network and value match", () => {
            const a = new PrivateKey(Buffer.alloc(32, 0x1), Network.mainnet);
            const b = new PrivateKey(Buffer.alloc(32, 0x1), Network.mainnet);
            expect(a.equals(b)).to.equal(true);
        });
    });
});
