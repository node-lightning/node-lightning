import { expect } from "chai";
import * as key from "../lib/key";
import * as s256 from "../lib/secp256k1";

describe("secp256k1", () => {
    describe(".ecdh()", () => {
        it("one way", () => {
            const apriv = Buffer.alloc(32, 1);
            const bpriv = Buffer.alloc(32, 2);
            const apub = key.getPublicKey(apriv);
            const point = s256.ecdh(apub, bpriv);
            expect(point.toString("hex")).to.equal(
                "b7c99dee100e6844572a8d9ee91975af09e602491d4ba32f6781261cd9c99173",
            );
        });

        it("other way", () => {
            const apriv = Buffer.alloc(32, 1);
            const bpriv = Buffer.alloc(32, 2);
            const bpub = key.getPublicKey(bpriv);
            const point = s256.ecdh(bpub, apriv);
            expect(point.toString("hex")).to.equal(
                "b7c99dee100e6844572a8d9ee91975af09e602491d4ba32f6781261cd9c99173",
            );
        });
    });

    describe(".privateKeyMul()", () => {
        it("multiplies", () => {
            const s1 = Buffer.alloc(32, 1);
            const tweak = Buffer.alloc(32);
            tweak[tweak.length - 1] = 2;
            const s2 = s256.privateKeyMul(s1, tweak);
            expect(s2.toString("hex")).to.equal(
                "0202020202020202020202020202020202020202020202020202020202020202",
            );
        });
    });

    describe(".sign()", () => {
        it("signs message", () => {
            const priv = Buffer.alloc(32, 1);
            const msg = Buffer.alloc(32);
            const signature = s256.sign(msg, priv);
            expect(signature.toString("hex")).to.equal(
                "6734cb4e3c071082482bf0f8579484f28dcdb1ca15b0cce72fbf130b2673d00c5fbeecc4075cfd6a52634210486f24ce6db20f2870e606acc43ade814d48394a",
            );
        });
    });

    describe(".sigToDER()", () => {
        it("DER encodes the signature", () => {
            const sig = Buffer.from(
                "6734cb4e3c071082482bf0f8579484f28dcdb1ca15b0cce72fbf130b2673d00c5fbeecc4075cfd6a52634210486f24ce6db20f2870e606acc43ade814d48394a",
                "hex",
            );
            const der = s256.sigToDER(sig);
            expect(der.toString("hex")).to.equal(
                "304402206734cb4e3c071082482bf0f8579484f28dcdb1ca15b0cce72fbf130b2673d00c02205fbeecc4075cfd6a52634210486f24ce6db20f2870e606acc43ade814d48394a",
            );
        });
    });

    describe(".verifySig()", () => {
        it("verifies message", () => {
            const msg = Buffer.alloc(32);
            const sig = Buffer.from(
                "6734cb4e3c071082482bf0f8579484f28dcdb1ca15b0cce72fbf130b2673d00c5fbeecc4075cfd6a52634210486f24ce6db20f2870e606acc43ade814d48394a",
                "hex",
            );
            const priv = Buffer.alloc(32, 1);
            const pub = key.getPublicKey(priv);
            const result = s256.verifySig(msg, sig, pub);
            expect(result).to.equal(true);
        });
    });

    describe(".isDERSig()", () => {
        it("returns false when not DER encoded signature", () => {
            const sig = Buffer.alloc(64);
            expect(s256.isDERSig(sig)).to.equal(false);
        });

        it("returns true when DER encoded signature", () => {
            const sig = Buffer.from(
                "304402206734cb4e3c071082482bf0f8579484f28dcdb1ca15b0cce72fbf130b2673d00c02205fbeecc4075cfd6a52634210486f24ce6db20f2870e606acc43ade814d48394a",
                "hex",
            );
            expect(s256.isDERSig(sig)).to.equal(true);
        });
    });

    const privA = Buffer.alloc(32, 1);
    const pubkeyA = key.getPublicKey(privA);

    const privB = Buffer.alloc(32, 2);
    const pubkeyB = key.getPublicKey(privB);

    describe(".publicKeyTweakAdd", () => {
        it("adds tweak * generator to the point", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex"); // prettier-ignore
            const result = s256.publicKeyTweakAdd(pubkeyA, tweak);
            expect(result.toString("hex")).to.equal(
                "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
            );
        });

        it("adds tweak * generator to the point", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = s256.publicKeyTweakAdd(pubkeyA, tweak);
            expect(result.toString("hex")).to.equal(
                "03c050c3f0b8d45b9e093a91cb96d097b24100e66585d0d8561e01c1231837493f",
            );
        });
    });

    describe(".publicKeyTweakMul", () => {
        it("multiplies the point by the tweak point", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = s256.publicKeyTweakMul(pubkeyA, tweak);
            expect(result.toString("hex")).to.equal(
                "031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
            );
        });

        it("multiplies a tweak * generator and adds it to the point", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000002", "hex"); // prettier-ignore
            const result = s256.publicKeyTweakMul(pubkeyA, tweak);
            expect(result.toString("hex")).to.equal(
                "024d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d0766",
            );
        });
    });

    describe(".publicKeyCombine()", () => {
        it("adds points to create compressed key", () => {
            const result = s256.publicKeyCombine([pubkeyA, pubkeyB], true);
            expect(result.toString("hex")).to.equal(
                "02531fe6068134503d2723133227c867ac8fa6c83c537e9a44c3c5bdbdcb1fe337",
            );
        });

        it("adds points to create uncompressed key", () => {
            const result = s256.publicKeyCombine([pubkeyA, pubkeyB], false);
            expect(result.toString("hex")).to.equal(
                "04531fe6068134503d2723133227c867ac8fa6c83c537e9a44c3c5bdbdcb1fe3379e92c265e71e481ba82a84675a47ac705a200fcd524e92d93b0e7386f26a5458",
            );
        });
    });

    describe(".privateKeyTweakAdd()", () => {
        it("adds identity to private key", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex"); // prettier-ignore
            const result = s256.privateKeyTweakAdd(privA, tweak);
            expect(result.toString("hex")).to.equal(
                "0101010101010101010101010101010101010101010101010101010101010101",
            );
        });

        it("adds tweak to private key", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = s256.privateKeyTweakAdd(privA, tweak);
            expect(result.toString("hex")).to.equal(
                "0101010101010101010101010101010101010101010101010101010101010102",
            );
        });

        it("doesn't mutate the value", () => {
            expect(privA).to.deep.equal(Buffer.alloc(32, 1));
        });
    });

    describe(".privateKeyTweakMul()", () => {
        it("multiplies by identity", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"); // prettier-ignore
            const result = s256.privateKeyTweakMul(privA, tweak);
            expect(result.toString("hex")).to.equal(
                "0101010101010101010101010101010101010101010101010101010101010101",
            );
        });

        it("multiplies by a tweak", () => {
            const tweak = Buffer.from("0000000000000000000000000000000000000000000000000000000000000002", "hex"); // prettier-ignore
            const result = s256.privateKeyTweakMul(privA, tweak);
            expect(result.toString("hex")).to.equal(
                "0202020202020202020202020202020202020202020202020202020202020202",
            );
        });

        it("doesn't mutate the value", () => {
            expect(privA).to.deep.equal(Buffer.alloc(32, 1));
        });
    });
});
