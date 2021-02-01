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
});
