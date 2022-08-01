import * as crypto from "@node-lightning/crypto";
import { expect } from "chai";
import { Network } from "../lib/Network";
import { PublicKey } from "../lib/PublicKey";

describe("PublicKey", () => {
    let sut: PublicKey;

    beforeEach(() => {
        const prvkey = Buffer.alloc(32, 1);
        const pubkey = crypto.getPublicKey(prvkey);
        sut = new PublicKey(pubkey, Network.mainnet);
    });

    it("throws on invalid public key length", () => {
        expect(() => new PublicKey(Buffer.alloc(1), Network.mainnet)).to.throw(
            "Invalid public key",
        );
    });

    it("throws on invalid public key point", () => {
        expect(
            () =>
                new PublicKey(
                    Buffer.from(
                        "030000000000000000000000000000000000000000000000000000000000000000",
                        "hex",
                    ),
                    Network.mainnet,
                ),
        ).to.throw("Invalid public key");
    });

    it("throws on invalid prefix", () => {
        expect(
            () =>
                new PublicKey(
                    Buffer.from(
                        "011b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
                        "hex",
                    ),
                    Network.mainnet,
                ),
        ).to.throw("Invalid public key");
    });

    describe(".fromWif()", () => {
        it("returns private key and compressed public key", () => {
            const pub = PublicKey.fromWif("cMahea7zqjxrtgAbB7LSGbcQUr1uX1ojuat9jZodMN8rFTv2sfUK"); // prettier-ignore
            expect(pub.compressed).to.equal(true);
            expect(pub.toHex()).to.equal("024f9b48f0ae9df11070c4c5ae2b012cd64599063e5bd32b5443548b786a06db2a"); // prettier-ignore
        });

        it("returns private key and uncompressed public key", () => {
            const pub = PublicKey.fromWif("91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjpWAxgzczjbCwxic"); // prettier-ignore
            expect(pub.compressed).to.equal(false);
            expect(pub.toHex()).to.equal("041d19a0e39a4e089c8473df05f305b6c936f19219a8c708218b143f01a633514771a1eeefb15ab6b1aa4540dd09b11e8f74d80e845765faddd53350270fde33de"); // prettier-ignore
        });
    });

    describe(".toBuffer()", () => {
        it("compressed", () => {
            expect(sut.toBuffer().toString("hex")).to.equal(
                "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
            );
        });

        it("uncompressed", () => {
            expect(
                sut
                    .toPubKey(false)
                    .toBuffer()
                    .toString("hex"),
            ).to.equal(
                "041b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f70beaf8f588b541507fed6a642c5ab42dfdf8120a7f639de5122d47a69a8e8d1",
            );
        });
    });

    describe(".toHex()", () => {
        it("compressed", () => {
            expect(sut.toHex()).to.equal(
                "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
            );
        });

        it("uncompressed", () => {
            expect(sut.toPubKey(false).toHex()).to.equal(
                "041b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f70beaf8f588b541507fed6a642c5ab42dfdf8120a7f639de5122d47a69a8e8d1",
            );
        });
    });

    describe(".hash160()", () => {
        it("compressed", () => {
            expect(sut.hash160().toString("hex")).to.equal(
                "79b000887626b294a914501a4cd226b58b235983",
            );
        });

        it("uncompressed", () => {
            expect(
                sut
                    .toPubKey(false)
                    .hash160()
                    .toString("hex"),
            ).to.equal("6ff3443c994fb2c821969dae53bd5b5052d8394f");
        });
    });

    describe(".toP2pkhAddress()", () => {
        it("compressed", () => {
            expect(sut.toP2pkhAddress()).to.equal("1C6Rc3w25VHud3dLDamutaqfKWqhrLRTaD");
        });

        it("uncompressed", () => {
            expect(sut.toPubKey(false).toP2pkhAddress()).to.equal(
                "1BCwRkTsYzK5aNK4sdF7Bpti3PhrkPtLc4",
            );
        });
    });

    describe(".toP2nwpkhAddress()", () => {
        it("creates address", () => {
            expect(sut.toP2nwpkhAddress()).to.equal("35LM1A29K95ADiQ8rJ9uEfVZCKffZE4D9i");
        });
    });

    describe(".toP2wpkhAddress()", () => {
        it("creates address", () => {
            expect(sut.toP2wpkhAddress()).to.equal("bc1q0xcqpzrky6eff2g52qdye53xkk9jxkvrh6yhyw");
        });
    });

    describe(".tweakAdd()", () => {
        it("adds tweak * generator to the point", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex"); // prettier-ignore
            const result = sut.tweakAdd(tweak);
            expect(result.toHex()).to.equal(
                "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
            );
        });

        it("adds tweak * generator to the point", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakAdd(tweak);
            expect(result.toHex()).to.equal(
                "03c050c3f0b8d45b9e093a91cb96d097b24100e66585d0d8561e01c1231837493f",
            );
        });

        it("maintains the same network", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakAdd(tweak);
            expect(result.network).to.equal(sut.network);
        });

        it("creates a new instance", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakAdd(tweak);
            expect(result).to.not.equal(sut);
        });

        it("throws with invalid tweak", () => {
            const tweak = Buffer.from("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", "hex"); // prettier-ignore
            expect(() => sut.tweakAdd(tweak)).to.throw(
                "The tweak was out of range or the resulted private key is invalid",
            );
        });
    });

    describe(".tweakMul()", () => {
        it("multiplies the point by the tweak point", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakMul(tweak);
            expect(result.toHex()).to.equal(
                "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
            );
        });

        it("multiplies a tweak * generator and adds it to the point", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000002", "hex"); // prettier-ignore
            const result = sut.tweakMul(tweak);
            expect(result.toHex()).to.equal(
                "024d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d0766",
            );
        });

        it("maintains the same network", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakMul(tweak);
            expect(result.network).to.equal(sut.network);
        });

        it("creates a new instance", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = sut.tweakMul(tweak);
            expect(result).to.not.equal(sut);
        });

        it("throws with out of range tweak", () => {
            const tweak = Buffer.from("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", "hex"); // prettier-ignore
            expect(() => sut.tweakMul(tweak)).to.throw(
                "The tweak was out of range or equal to zero",
            );
        });
    });

    describe(".add()", () => {
        const prvkey = Buffer.alloc(32, 2);
        const pubkey = crypto.getPublicKey(prvkey);
        let other: PublicKey;

        beforeEach(() => {
            other = new PublicKey(pubkey, Network.mainnet);
        });

        it("adds point point correctly", () => {
            const result = sut.add(other);
            expect(result.toHex()).to.equal(
                "02531fe6068134503d2723133227c867ac8fa6c83c537e9a44c3c5bdbdcb1fe337",
            );
        });

        it("maintains the same network", () => {
            const result = sut.add(other);
            expect(result.network).to.equal(sut.network);
        });

        it("creates new instance", () => {
            const result = sut.add(other);
            expect(result).to.not.equal(sut);
            expect(result).to.not.equal(other);
        });

        it("throws with invalid network", () => {
            other = new PublicKey(pubkey, Network.testnet);
            expect(() => sut.add(other)).to.throw("Network mismatch");
        });
    });
});
