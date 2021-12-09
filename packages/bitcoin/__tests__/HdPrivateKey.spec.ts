import { expect } from "chai";
import { HdKeyType, Mnemonic } from "../lib";
import { HdPrivateKey } from "../lib/HdPrivateKey";
import { Network } from "../lib/Network";

describe("HdPrivateKey", () => {
    describe(".derive()", () => {
        it("pub key can derive pub key", () => {
            const seed = Buffer.alloc(32, 0x01);
            const master = HdPrivateKey.fromSeed(seed, Network.mainnet);
            const key = master.derive(0).derive(1);
            expect(key.depth).to.equal(2);
        });

        it("throws if given xpub", () => {
            expect(() =>
                HdPrivateKey.decode(
                    "xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw",
                ),
            ).to.throw("Invalid HD private key");
        });
    });

    describe(".isHardened", () => {
        const seed = Buffer.alloc(32, 0x01);
        it("true when hardened", () => {
            const account = HdPrivateKey.fromPath("m/84'/0'/0'", seed, Network.mainnet);
            expect(account.isHardened).to.equal(true);
        });

        it("false when not-hardened", () => {
            const account = HdPrivateKey.fromPath("m/84'/0'/0'", seed, Network.mainnet);
            expect(account.derive(0).isHardened).to.equal(false);
        });
    });

    describe(".fromPath()", () => {
        const seed = Buffer.alloc(32, 0x01);

        it("throws if doesnt start with m", () => {
            expect(() => HdPrivateKey.fromPath("q/84'/0'/0'", seed, Network.mainnet)).to.throw(
                "Invalid HD key path",
            );
        });

        it("throws if number is negative", () => {
            expect(() => HdPrivateKey.fromPath("m/84'/0'/0'/-6", seed, Network.mainnet)).to.throw(
                "Invalid HD key path",
            );
        });

        it("throws if number is above max value", () => {
            expect(() =>
                HdPrivateKey.fromPath("m/84'/0'/0'/2147483648'", seed, Network.mainnet),
            ).to.throw("Invalid HD key path");
        });

        it("throws if number is above max non-hardened value", () => {
            expect(() =>
                HdPrivateKey.fromPath("m/84'/0'/0'/2147483649", seed, Network.mainnet),
            ).to.throw("Invalid HD key path");
        });

        it("throws if part is not a number", () => {
            expect(() => HdPrivateKey.fromPath("m/84'/0'/0'/a", seed, Network.mainnet)).to.throw(
                "Invalid HD key path",
            );
        });

        it("master defaults to x", () => {
            const master = HdPrivateKey.fromSeed(seed, Network.mainnet);
            expect(master.type).to.equal(HdKeyType.x);
        });

        it("master specifies y", () => {
            const master = HdPrivateKey.fromSeed(seed, Network.mainnet, HdKeyType.y);
            expect(master.type).to.equal(HdKeyType.y);
        });

        it("derives x type", () => {
            const key = HdPrivateKey.fromPath("m/44'/0'/0", seed, Network.mainnet);
            expect(key.type).to.equal(HdKeyType.x);
        });

        it("derives y type (BIP49)", () => {
            const key = HdPrivateKey.fromPath("m/49'/0'/0", seed, Network.mainnet);
            expect(key.type).to.equal(HdKeyType.y);
        });

        it("derives z type (BIP84)", () => {
            const key = HdPrivateKey.fromPath("m/84'/0'/0", seed, Network.mainnet);
            expect(key.type).to.equal(HdKeyType.z);
        });

        it("accepts y type (BIP49)", () => {
            const key = HdPrivateKey.fromPath("m/49'/0'/0", seed, Network.mainnet, HdKeyType.y);
            expect(key.type).to.equal(HdKeyType.y);
        });

        it("accepts z type (BIP84)", () => {
            const key = HdPrivateKey.fromPath("m/84'/0'/0", seed, Network.mainnet, HdKeyType.z);
            expect(key.type).to.equal(HdKeyType.z);
        });

        it("accepts incorrect x type", () => {
            const key = HdPrivateKey.fromPath("m/49'/0'/0", seed, Network.mainnet, HdKeyType.x);
            expect(key.type).to.equal(HdKeyType.x);
        });

        it("accepts incorrect y type", () => {
            const key = HdPrivateKey.fromPath("m/44'/0'/0", seed, Network.mainnet, HdKeyType.y);
            expect(key.type).to.equal(HdKeyType.y);
        });

        it("accepts incorrect z type", () => {
            const key = HdPrivateKey.fromPath("m/44'/0'/0", seed, Network.mainnet, HdKeyType.z);
            expect(key.type).to.equal(HdKeyType.z);
        });
    });

    describe(".toWif()", () => {
        it("encodes", () => {
            const seed = Mnemonic.phraseToSeed("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"); // prettier-ignore
            const path = "m/84'/0'/0'/0/0";
            const sut = HdPrivateKey.fromPath(path, seed, Network.mainnet);
            expect(sut.toWif()).to.equal("KyZpNDKnfs94vbrwhJneDi77V6jF64PWPF8x5cdJb8ifgg2DUc9d");
        });
    });

    describe(".deriveHardened()", () => {
        const seed = Mnemonic.phraseToSeed("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"); // prettier-ignore

        it("input < 0x80000000", () => {
            const sut = HdPrivateKey.fromSeed(seed, Network.mainnet);
            const expected = sut.derive(0x80000001);
            const actual = sut.deriveHardened(1);
            expect(expected.encode()).to.equal(actual.encode());
        });

        it("input > 0x80000000", () => {
            const sut = HdPrivateKey.fromSeed(seed, Network.mainnet);
            const expected = sut.derive(0x80000001);
            const actual = sut.deriveHardened(0x80000001);
            expect(expected.encode()).to.equal(actual.encode());
        });
    });

    describe(".toAddress()", () => {
        const seed = Mnemonic.phraseToSeed("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"); // prettier-ignore

        it("generates x-type address", () => {
            const path = "m/0";
            const sut = HdPrivateKey.fromPath(path, seed, Network.mainnet, HdKeyType.x);
            expect(sut.toAddress()).to.equal("18mDodGPRAoNV5gVGpuQKaEr85kXBuz23z");
        });

        it("generates y-type address", () => {
            const path = "m/0";
            const sut = HdPrivateKey.fromPath(path, seed, Network.mainnet, HdKeyType.y);
            expect(sut.toAddress()).to.equal("3EwDCTtQFWwe81Gwpfsf6kxt7AL34kqH5V");
        });

        it("generates z-type address", () => {
            const path = "m/0";
            const sut = HdPrivateKey.fromPath(path, seed, Network.mainnet, HdKeyType.z);
            expect(sut.toAddress()).to.equal("bc1q25jaaa5xx0m596uz3gltyaqea2vptae4jn9a74");
        });
    });

    describe(".toBuffer()", () => {
        const seed = Buffer.alloc(32, 0x01);
        it("returns underlying buffer", () => {
            const prvkey = HdPrivateKey.fromPath("m/84'/0'/0'/0/0", seed, Network.mainnet);
            const actual = prvkey.toBuffer();
            const expected = prvkey.privateKey.toBuffer();
            expect(actual).to.deep.equal(expected);
        });
    });

    describe(".toHex()", () => {
        const seed = Buffer.alloc(32, 0x01);
        it("returns underlying buffer", () => {
            const prvkey = HdPrivateKey.fromPath("m/84'/0'/0'/0/0", seed, Network.mainnet);
            const actual = prvkey.toHex();
            const expected = prvkey.privateKey.toHex();
            expect(actual).to.deep.equal(expected);
        });
    });
});
