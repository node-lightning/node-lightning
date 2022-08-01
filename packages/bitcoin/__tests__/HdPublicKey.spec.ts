import { expect } from "chai";
import { HdKeyType, HdPublicKey } from "../lib";
import { HdPrivateKey } from "../lib/HdPrivateKey";
import { Network } from "../lib/Network";

describe("HdPublicKey", () => {
    const seed = Buffer.alloc(32, 0x01);

    describe("#decode()", () => {
        it("throws if given xprv", () => {
            expect(() =>
                HdPublicKey.decode(
                    "xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7",
                ),
            ).to.throw("Invalid HD public key");
        });
    });

    describe(".isHardened", () => {
        it("true when hardened", () => {
            const account = HdPrivateKey.fromPath("m/84'/0'/0'", seed, Network.mainnet);
            expect(account.toPubKey().isHardened).to.equal(true);
        });

        it("false when not-hardened", () => {
            const account = HdPrivateKey.fromPath("m/84'/0'/0'", seed, Network.mainnet);
            expect(account.derive(0).toPubKey().isHardened).to.equal(false);
        });
    });

    describe(".fingerprint", () => {
        const seed = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
        it("returns fingerprint", () => {
            const master = HdPrivateKey.fromSeed(seed, Network.mainnet).toPubKey();
            const expected = HdPublicKey.decode(
                "xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw",
            ).parentFingerprint;
            expect(master.fingerprint.slice(0, 4)).to.deep.equal(expected);
        });
    });

    describe(".derive()", () => {
        it("pub key can derive pub key", () => {
            const seed = Buffer.alloc(32, 0x01);
            const master = HdPrivateKey.fromSeed(seed, Network.mainnet);
            const pubkey = master.toPubKey();
            const key = pubkey.derive(0).derive(1);
            expect(key.depth).to.equal(2);
        });

        it("matches HdPrivateKey derive", () => {
            const account = HdPrivateKey.fromPath("m/84'/0'/0'", seed, Network.mainnet);
            const expected = account
                .derive(0)
                .derive(0)
                .toPubKey()
                .toSecHex();
            const actual = account
                .toPubKey()
                .derive(0)
                .derive(0)
                .toSecHex();
            expect(actual).to.equal(expected);
        });

        it("throws with hardened", () => {
            const account = HdPrivateKey.fromPath("m/84'/0'/0'", seed, Network.mainnet);
            expect(() => account.toPubKey().derive(0x80000000)).to.throw(
                "Invalid HD key derivation",
            );
        });
    });

    describe(".toAddress()", () => {
        const seed = Buffer.alloc(32, 0x01);

        it("xpub", () => {
            const pubkey = HdPrivateKey.fromPath(
                "m/0",
                seed,
                Network.mainnet,
                HdKeyType.x,
            ).toPubKey();
            expect(pubkey.toAddress()).to.equal("1J5RZmj33xPt9TRnHFEKDoZgxqT2e2us12");
        });

        it("ypub", () => {
            const pubkey = HdPrivateKey.fromPath(
                "m/0",
                seed,
                Network.mainnet,
                HdKeyType.y,
            ).toPubKey();
            expect(pubkey.toAddress()).to.equal("3PmmbYZxjBnsyLaC3oehbHpZqciLbxiEog");
        });

        it("zpub", () => {
            const pubkey = HdPrivateKey.fromPath(
                "m/0",
                seed,
                Network.mainnet,
                HdKeyType.z,
            ).toPubKey();
            expect(pubkey.toAddress()).to.equal("bc1qhdgyak30llluz36r6lk5ywup5uq0jz0ecsecfv");
        });
    });

    describe(".toSecBuffer()", () => {
        it("returns underlying buffer", () => {
            const pubkey = HdPrivateKey.fromPath(
                "m/84'/0'/0'/0/0",
                seed,
                Network.mainnet,
            ).toPubKey();
            const actual = pubkey.toSecBuffer();
            const expected = pubkey.publicKey.toBuffer();
            expect(actual).to.deep.equal(expected);
        });
    });

    describe(".toSecHex()", () => {
        it("returns underlying buffer", () => {
            const pubkey = HdPrivateKey.fromPath(
                "m/84'/0'/0'/0/0",
                seed,
                Network.mainnet,
            ).toPubKey();
            const actual = pubkey.toSecHex();
            const expected = pubkey.publicKey.toHex();
            expect(actual).to.deep.equal(expected);
        });
    });
});
