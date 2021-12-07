/* eslint-disable @typescript-eslint/no-empty-function */
import { expect } from "chai";
import secp256k1 from "../lib";
import crypto from "crypto";

describe("Secp256k1", () => {
    const zero = Buffer.alloc(32);
    const N = Buffer.from(
        "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
        "hex",
    );
    const one = Buffer.from(
        "0000000000000000000000000000000000000000000000000000000000000001",
        "hex",
    );
    const prvkeys = [Buffer.alloc(32, 0x01), Buffer.alloc(32, 0x02)];
    const pubkeys = prvkeys.map(p => secp256k1.publicKeyCreate(p, true));
    const msg = Buffer.alloc(32, 0x01);

    describe(".contextRandomize()", () => {
        describe("arg: invalid seed", () => {
            it("undefined seed", () => {
                expect(() => secp256k1.contextRandomize(undefined)).to.throw(
                    "Expected seed to be an Uint8Array or null",
                );
            });

            it("invalid seed length", () => {
                const seed = new Uint8Array(42);
                expect(
                    () => secp256k1.contextRandomize(seed),
                    "Expected seed tp an Uint8Array with length 32",
                );
            });
        });

        describe("arg: valid seed", () => {
            it("valid seed", () => {
                const seed = Buffer.alloc(32, 0x01);
                secp256k1.contextRandomize(seed);
            });

            it("null seed", () => {
                secp256k1.contextRandomize(null);
            });
        });
    });

    describe(".ecdh()", () => {
        describe("arg: invalid public key", () => {
            it("throws null value", () => {
                const prvkey = prvkeys[0];
                const pubkey = null;
                expect(() => secp256k1.ecdh(pubkey, prvkey)).to.throw(
                    "Expected public key to be an Uint8Array",
                );
            });

            it("throws with invalid length pubkey", () => {
                const prvkey = prvkeys[0];
                const pubkey = pubkeys[0].slice(1);
                expect(() => secp256k1.ecdh(pubkey, prvkey)).to.throw(
                    "Expected public key to be an Uint8Array with length [33, 65]",
                );
            });

            it("throws with invalid public key", () => {
                const prvkey = prvkeys[0];
                const pubkey = Buffer.from(pubkeys[0]);
                pubkey[0] = 0x01;
                expect(() => secp256k1.ecdh(pubkey, prvkey)).to.throw(
                    "Public Key could not be parsed",
                );
            });
        });

        describe("arg: invalid private key", () => {
            it("throws null value", () => {
                const prvkey = null;
                const pubkey = pubkeys[0];
                expect(() => secp256k1.ecdh(pubkey, prvkey)).to.throw(
                    "Expected private key to be an Uint8Array",
                );
            });

            it("throws invalid length", () => {
                const prvkey = prvkeys[0].slice(1);
                const pubkey = pubkeys[0];
                expect(() => secp256k1.ecdh(pubkey, prvkey)).to.throw(
                    "Expected private key to be an Uint8Array with length 32",
                );
            });

            it("throws when private key is zero", () => {
                const prvkey = Buffer.alloc(32);
                const pubkey = pubkeys[0];
                expect(() => secp256k1.ecdh(pubkey, prvkey)).to.throw(
                    "Scalar was invalid (zero or overflow)",
                );
            });

            it("throws when private key >= N", () => {
                const pubkey = pubkeys[0];
                expect(() => secp256k1.ecdh(pubkey, N)).to.throw(
                    "Scalar was invalid (zero or overflow",
                );
            });
        });

        describe("arg: invalid options", () => {
            it("throws null options", () => {
                expect(() => secp256k1.ecdh(pubkeys[0], prvkeys[0], null)).to.throw(
                    "Expected options to be an Object",
                );
            });

            it("throws number options", () => {
                expect(() => secp256k1.ecdh(pubkeys[0], prvkeys[0], Number(32) as any)).to.throw(
                    "Expected options to be an Object",
                );
            });

            it("throws with invalid data", () => {
                expect(() => secp256k1.ecdh(pubkeys[0], prvkeys[0], { data: null })).to.throw(
                    "Expected options.data to be an Uint8Array",
                );
            });

            it("throws with invalid data", () => {
                expect(() => secp256k1.ecdh(pubkeys[0], prvkeys[0], { data: null })).to.throw(
                    "Expected options.data to be an Uint8Array",
                );
            });

            it("throws with invalid hashfn type", () => {
                expect(() => secp256k1.ecdh(pubkeys[0], prvkeys[0], { hashfn: null })).to.throw(
                    "Expected options.hashfn to be a Function",
                );
            });

            it("throws with invalid xbuf type", () => {
                expect(() =>
                    secp256k1.ecdh(pubkeys[0], prvkeys[0], {
                        hashfn: () => new Uint8Array(32),
                        xbuf: null,
                    }),
                ).to.throw("Expected options.xbuf to be an Uint8Array");
            });

            it("throws with invalid xbuf length", () => {
                expect(() =>
                    secp256k1.ecdh(pubkeys[0], prvkeys[0], {
                        hashfn: () => new Uint8Array(32),
                        xbuf: new Uint8Array(42),
                    }),
                ).to.throw("Expected options.xbuf to be an Uint8Array");
            });

            it("throws with invalid ybuf type", () => {
                expect(() =>
                    secp256k1.ecdh(pubkeys[0], prvkeys[0], {
                        hashfn: () => new Uint8Array(32),
                        xbuf: new Uint8Array(32),
                        ybuf: null,
                    }),
                ).to.throw("Expected options.ybuf to be an Uint8Array");
            });

            it("throws with invalid ybuf length", () => {
                expect(() =>
                    secp256k1.ecdh(pubkeys[0], prvkeys[0], {
                        hashfn: () => new Uint8Array(32),
                        xbuf: new Uint8Array(32),
                        ybuf: new Uint8Array(42),
                    }),
                ).to.throw("Expected options.ybuf to be an Uint8Array");
            });
        });

        describe("args: invalid output", () => {
            it("throws with invalid output type", () => {
                expect(() => secp256k1.ecdh(pubkeys[0], prvkeys[0], {}, null)).to.throw(
                    "Expected output to be an Uint8Array",
                );
            });

            it("throws with invalid output length", () => {
                expect(() =>
                    secp256k1.ecdh(pubkeys[0], prvkeys[0], {}, new Uint8Array(42)),
                ).to.throw("Expected output to be an Uint8Array with length 32");
            });
        });

        describe("hashfn usage", () => {
            const sk = prvkeys[0];
            const pk = pubkeys[0];
            const data = new Uint8Array(42);
            const xbuf = new Uint8Array(32);
            const ybuf = new Uint8Array(32);
            const expected = crypto.randomBytes(32);

            function hashfn(xbuf: Uint8Array, ybuf: Uint8Array, data: Uint8Array): Uint8Array {
                expect(xbuf).to.equal(xbuf);
                expect(ybuf).to.equal(ybuf);
                expect(data).to.equal(data);
                return expected;
            }

            it("returns hash result", () => {
                const actual = secp256k1.ecdh(pk, sk, { data, hashfn, xbuf, ybuf });
                expect(Buffer.from(actual)).to.deep.equal(expected);
            });

            it("throws with invalid hashfn type", () => {
                expect(() => secp256k1.ecdh(pk, sk, { hashfn: () => null })).to.throw(
                    "Scalar was invalid (zero or overflow)",
                );
            });

            it("throws with invalid hash length", () => {
                expect(() => secp256k1.ecdh(pk, sk, { hashfn: () => new Uint8Array(31) })).to.throw(
                    "Scalar was invalid (zero or overflow)",
                );
            });
        });

        describe("valid", () => {
            it("reciprical match", () => {
                const r1 = secp256k1.ecdh(pubkeys[0], prvkeys[1]);
                const r2 = secp256k1.ecdh(pubkeys[1], prvkeys[0]);
                expect(r1).to.deep.equal(r2);
            });

            for (let i = 0; i < 10; i++) {
                it("random " + (i + 1), () => {
                    const sk1 = crypto.randomBytes(32);
                    const sk2 = crypto.randomBytes(32);
                    const pk1 = secp256k1.publicKeyCreate(sk1, true);
                    const pk2 = secp256k1.publicKeyCreate(sk2, true);
                    const r1 = secp256k1.ecdh(pk1, sk2);
                    const r2 = secp256k1.ecdh(pk2, sk1);
                    expect(r1).to.deep.equal(r2);
                });
            }

            it("arg: using output", () => {
                const output = new Uint8Array(32);
                secp256k1.ecdh(pubkeys[0], prvkeys[0], {}, output);
                expect(Buffer.from(output).toString("hex")).to.equal(
                    "60bff7e2a4e757df5e69ed48632b993b9447ff480784964c6dc587ceef975a27",
                );
            });
        });
    });

    describe(".ecdsaSign()", () => {
        describe("arg: invalid message", () => {
            it("throws with invalid message type", () => {
                expect(() => secp256k1.ecdsaSign(null, prvkeys[0])).to.throw(
                    "Expected message to be an Uint8Array",
                );
            });

            it("throws with invalid message length", () => {
                expect(() => secp256k1.ecdsaSign(msg.slice(1), prvkeys[0])).to.throw(
                    "Expected message to be an Uint8Array with length 32",
                );
            });
        });

        describe("arg: invalid private key", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.ecdsaSign(msg, null)).to.throw(
                    "Expected private key to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.ecdsaSign(msg, prvkeys[0].slice(1))).to.throw(
                    "Expected private key to be an Uint8Array with length 32",
                );
            });

            it("throws when private key is zero", () => {
                expect(() => secp256k1.ecdsaSign(msg, zero)).to.throw(
                    "The nonce generation function failed, or the private key was invalid",
                );
            });

            it("throws when private key is >= N", () => {
                expect(() => secp256k1.ecdsaSign(msg, N)).to.throw(
                    "The nonce generation function failed, or the private key was invalid",
                );
            });
        });

        describe("args: invalid output", () => {
            it("throws with invalid output type", () => {
                expect(() => secp256k1.ecdsaSign(msg, prvkeys[0], {}, null)).to.throw(
                    "Expected output to be an Uint8Array",
                );
            });

            it("throws with invalid output length", () => {
                expect(() => secp256k1.ecdsaSign(msg, prvkeys[0], {}, new Uint8Array(42))).to.throw(
                    "Expected output to be an Uint8Array with length 64",
                );
            });
        });

        describe("noncefn usage", () => {
            const data = new Uint8Array(42);
            const nonce = crypto.randomBytes(32);

            function noncefn(
                msg2: Uint8Array,
                prvkey: Uint8Array,
                a: any,
                data: Uint8Array,
                b: any,
            ): Uint8Array {
                expect(msg2).to.equal(msg);
                expect(prvkey).to.equal(prvkeys[0]);
                expect(data).to.equal(data);
                return nonce;
            }

            it("returns valid signature", () => {
                secp256k1.ecdsaSign(msg, prvkeys[0], { data, noncefn });
            });

            it("throws with invalid noncefn type", () => {
                expect(() =>
                    secp256k1.ecdsaSign(msg, prvkeys[0], { noncefn: () => null }),
                ).to.throw("The nonce generation function failed, or the private key was invalid");
            });

            it("throws with invalid nonce result length", () => {
                expect(() =>
                    secp256k1.ecdsaSign(msg, prvkeys[0], { noncefn: () => new Uint8Array(42) }),
                ).to.throw("The nonce generation function failed, or the private key was invalid");
            });
        });

        describe("valid", () => {
            it("generates valid signature", () => {
                const r = secp256k1.ecdsaSign(msg, prvkeys[0]);
                expect(Buffer.from(r.signature).toString("hex")).to.equal(
                    "c64b1924157748652733c41294e5f6e395c3626a8e911f3742a4b8ad4fdb922f347ba5cdd629027ef5846eb85c9452f6312e0aea697625d66b202448f3e9618f",
                );
            });
        });

        describe("sign/verify/recover", () => {
            for (let i = 0; i < 10; i++) {
                it("test " + (i + 1), () => {
                    const msg = crypto.randomBytes(32);
                    const prvkey = crypto.randomBytes(32);
                    const pubkeyc = secp256k1.publicKeyCreate(prvkey, true);
                    const pubkeyu = secp256k1.publicKeyCreate(prvkey, false);

                    const sig = secp256k1.ecdsaSign(msg, prvkey);
                    expect(secp256k1.ecdsaVerify(sig.signature, msg, pubkeyu)).to.equal(true);
                    expect(secp256k1.ecdsaVerify(sig.signature, msg, pubkeyc)).to.equal(true);
                    expect(
                        Buffer.from(secp256k1.ecdsaRecover(sig.signature, sig.recid, msg, true)),
                    ).to.deep.equal(pubkeyc);
                    expect(
                        Buffer.from(secp256k1.ecdsaRecover(sig.signature, sig.recid, msg, false)),
                    ).to.deep.equal(pubkeyu);
                });
            }
        });
    });

    describe(".ecdsaVerify()", () => {
        const sig = Buffer.from(
            "c64b1924157748652733c41294e5f6e395c3626a8e911f3742a4b8ad4fdb922f347ba5cdd629027ef5846eb85c9452f6312e0aea697625d66b202448f3e9618f",
            "hex",
        );

        describe("arg: invalid signature", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.ecdsaVerify(null, msg, pubkeys[0])).to.throw(
                    "Expected signature to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.ecdsaVerify(new Uint8Array(63), msg, pubkeys[0])).to.throw(
                    "Expected signature to be an Uint8Array with length 64",
                );
            });
        });

        describe("arg: invalid message", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.ecdsaVerify(sig, null, pubkeys[0])).to.throw(
                    "Expected message to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.ecdsaVerify(sig, msg.slice(1), pubkeys[0])).to.throw(
                    "Expected message to be an Uint8Array with length 32",
                );
            });
        });

        describe("arg: invalid public key", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.ecdsaVerify(sig, msg, null)).to.throw(
                    "Expected public key to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.ecdsaVerify(sig, msg, pubkeys[0].slice(1))).to.throw(
                    "Expected public key to be an Uint8Array with length [33, 65]",
                );
            });

            it("throws with invalid version", () => {
                const pubkey = Buffer.from(pubkeys[0]);
                pubkey[0] = 0x01;
                expect(() => secp256k1.ecdsaVerify(sig, msg, pubkey)).to.throw(
                    "Public Key could not be parsed",
                );
            });
        });

        describe("returns true/false", () => {
            it("returns true", () => {
                expect(secp256k1.ecdsaVerify(sig, msg, pubkeys[0])).to.equal(true);
            });

            it("returns false for wrong message", () => {
                expect(secp256k1.ecdsaVerify(sig, Buffer.alloc(32, 0x02), pubkeys[0])).to.equal(
                    false,
                );
            });

            it("returns false for incorrect R", () => {
                const newSig = Buffer.concat([Buffer.alloc(32), sig.slice(32)]);
                expect(secp256k1.ecdsaVerify(newSig, msg, pubkeys[0])).to.equal(false);
            });

            it("returns false for incorrect S", () => {
                const newSig = Buffer.concat([sig.slice(0, 32), Buffer.alloc(32)]);
                expect(secp256k1.ecdsaVerify(newSig, msg, pubkeys[0])).to.equal(false);
            });
        });
    });

    describe(".ecdsaRecover()", () => {
        const sig = Buffer.from(
            "c64b1924157748652733c41294e5f6e395c3626a8e911f3742a4b8ad4fdb922f347ba5cdd629027ef5846eb85c9452f6312e0aea697625d66b202448f3e9618f",
            "hex",
        );

        describe("arg: invalid signature", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.ecdsaRecover(null, 0, msg)).to.throw(
                    "Expected signature to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.ecdsaRecover(new Uint8Array(63), 0, msg)).to.throw(
                    "Expected signature to be an Uint8Array with length 64",
                );
            });
        });

        describe("arg: invalid recovery", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.ecdsaRecover(sig, null, msg)).to.throw(
                    "Expected recovery id to be a Number within interval [0, 3]",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.ecdsaRecover(sig, 4, msg)).to.throw(
                    "Expected recovery id to be a Number within interval [0, 3]",
                );
            });
        });

        describe("arg: invalid message", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.ecdsaRecover(sig, 0, null)).to.throw(
                    "Expected message to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.ecdsaRecover(sig, 0, msg.slice(1))).to.throw(
                    "Expected message to be an Uint8Array with length 32",
                );
            });
        });

        describe("arg: invalid compressed flag", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.ecdsaRecover(sig, 0, msg, null)).to.throw(
                    "Expected compressed to be a Boolean",
                );
            });
        });

        describe("arg: invalid output", () => {
            it("throws with invalid output type", () => {
                expect(() => secp256k1.ecdsaRecover(sig, 0, msg, true, null)).to.throw(
                    "Expected output to be an Uint8Array",
                );
            });

            it("throws with invalid output length", () => {
                expect(() =>
                    secp256k1.ecdsaRecover(sig, 0, msg, true, new Uint8Array(42)),
                ).to.throw("Expected output to be an Uint8Array with length 33");
            });

            it("throws with invalid output length", () => {
                expect(() =>
                    secp256k1.ecdsaRecover(sig, 0, msg, false, new Uint8Array(42)),
                ).to.throw("Expected output to be an Uint8Array with length 65");
            });
        });

        describe("valid/invalid", () => {
            it("returns pubkey when valid", () => {
                const result = secp256k1.ecdsaRecover(sig, 0, msg, true);
                expect(Buffer.from(result)).to.deep.equal(pubkeys[0]);
            });

            it("throws with invalid R", () => {
                const badSig = Buffer.concat([Buffer.alloc(32), sig.slice(32)]);
                expect(() => secp256k1.ecdsaRecover(badSig, 0, msg)).to.throw(
                    "Public key could not be recover",
                );
            });

            it("throws with invalid S", () => {
                const badSig = Buffer.concat([sig.slice(0, 32), Buffer.alloc(32)]);
                expect(() => secp256k1.ecdsaRecover(badSig, 0, msg)).to.throw(
                    "Public key could not be recover",
                );
            });

            it("throws when wrong recid", () => {
                expect(() => secp256k1.ecdsaRecover(sig, 2, msg, true)).to.throw(
                    "Public key could not be recover",
                );
            });
        });
    });

    describe(".privateKeyVerify()", () => {
        describe("arg: invalid private key", () => {
            it("returns false with null", () => {
                expect(secp256k1.privateKeyVerify(null)).to.equal(false);
            });

            it("returns false with incorrect length", () => {
                expect(secp256k1.privateKeyVerify(new Uint8Array(31))).to.equal(false);
            });
        });

        describe("validates private key", () => {
            it("returns false when zero", () => {
                expect(secp256k1.privateKeyVerify(zero)).to.equal(false);
            });

            it("returns false when >= N", () => {
                expect(secp256k1.privateKeyVerify(N)).to.equal(false);
            });

            for (let i = 0; i < 10; i++) {
                it("random test " + (i + 1), () => {
                    expect(secp256k1.privateKeyVerify(crypto.randomBytes(32))).to.equal(true);
                });
            }
        });
    });

    describe(".privateKeyNegate()", () => {
        describe("arg: invalid private key", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.privateKeyNegate(null)).to.throw(
                    "Expected private key to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.privateKeyNegate(new Uint8Array(31))).to.throw(
                    "Expected private key to be an Uint8Array with length 32",
                );
            });

            it("throws with zero", () => {
                expect(() => secp256k1.privateKeyNegate(zero)).to.throw(
                    "Impossible case. Please create issue.",
                );
            });

            it("throws when >= N", () => {
                expect(() => secp256k1.privateKeyNegate(N)).to.throw(
                    "Impossible case. Please create issue.",
                );
            });
        });

        describe("valid private key", () => {
            it("negates 1", () => {
                const n1 = Buffer.from(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                    "hex",
                );
                const actual = secp256k1.privateKeyNegate(n1);
                expect(Buffer.from(actual).toString("hex")).to.equal(
                    "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140",
                );
            });

            it("negates N-1", () => {
                const n1 = Buffer.from(
                    "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140",
                    "hex",
                );
                const actual = secp256k1.privateKeyNegate(n1);
                expect(Buffer.from(actual).toString("hex")).to.equal(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                );
            });

            for (let i = 0; i < 10; i++) {
                it("random test " + (i + 1), () => {
                    const sk = crypto.randomBytes(32);
                    const a = secp256k1.privateKeyNegate(sk);
                    const b = secp256k1.privateKeyNegate(a);
                    expect(Buffer.from(b)).to.deep.equal(sk);
                });
            }
        });
    });

    describe(".privateKeyTweakAdd()", () => {
        describe("arg: invalid private key", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.privateKeyTweakAdd(null, prvkeys[1])).to.throw(
                    "Expected private key to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.privateKeyTweakAdd(new Uint8Array(31), prvkeys[1])).to.throw(
                    "Expected private key to be an Uint8Array with length 32",
                );
            });

            it("throws with zero", () => {
                expect(() => secp256k1.privateKeyTweakAdd(zero, prvkeys[1])).to.throw(
                    "The tweak was out of range or the resulted private key is invalid",
                );
            });

            it("throws when >= N", () => {
                expect(() => secp256k1.privateKeyTweakAdd(N, prvkeys[1])).to.throw(
                    "The tweak was out of range or the resulted private key is invalid",
                );
            });
        });

        describe("arg: invalid tweak", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.privateKeyTweakAdd(prvkeys[0], null)).to.throw(
                    "Expected tweak to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.privateKeyTweakAdd(prvkeys[0], new Uint8Array(31))).to.throw(
                    "Expected tweak to be an Uint8Array with length 32",
                );
            });
        });

        describe("valid", () => {
            it("same with zero", () => {
                const result = secp256k1.privateKeyTweakAdd(prvkeys[0], zero);
                expect(result).to.deep.equal(prvkeys[0]);
            });

            it("same with N", () => {
                const result = secp256k1.privateKeyTweakAdd(prvkeys[0], N);
                expect(result).to.deep.equal(prvkeys[0]);
            });

            it("tweaks value", () => {
                const one = Buffer.from(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                    "hex",
                );
                const result = secp256k1.privateKeyTweakAdd(prvkeys[0], one);
                expect(Buffer.from(result).toString("hex")).to.equal(
                    "0101010101010101010101010101010101010101010101010101010101010102",
                );
            });

            for (let i = 0; i < 10; i++) {
                it("random " + (i + 1), () => {
                    const sk = crypto.randomBytes(32);
                    const t = crypto.randomBytes(32);
                    secp256k1.privateKeyTweakAdd(sk, t);
                });
            }
        });
    });

    describe(".privateKeyTweakMul()", () => {
        describe("arg: invalid private key", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.privateKeyTweakMul(null, prvkeys[1])).to.throw(
                    "Expected private key to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.privateKeyTweakMul(new Uint8Array(31), prvkeys[1])).to.throw(
                    "Expected private key to be an Uint8Array with length 32",
                );
            });

            it("throws with zero", () => {
                expect(() => secp256k1.privateKeyTweakMul(zero, prvkeys[1])).to.throw(
                    "The tweak was out of range or equal to zero",
                );
            });

            it("throws when >= N", () => {
                expect(() => secp256k1.privateKeyTweakMul(N, prvkeys[1])).to.throw(
                    "The tweak was out of range or equal to zero",
                );
            });
        });

        describe("arg: invalid tweak", () => {
            it("throws with invalid type", () => {
                expect(() => secp256k1.privateKeyTweakMul(prvkeys[0], null)).to.throw(
                    "Expected tweak to be an Uint8Array",
                );
            });

            it("throws with invalid length", () => {
                expect(() => secp256k1.privateKeyTweakMul(prvkeys[0], new Uint8Array(31))).to.throw(
                    "Expected tweak to be an Uint8Array with length 32",
                );
            });
        });

        describe("valid", () => {
            it("tweaks value", () => {
                const result = secp256k1.privateKeyTweakMul(prvkeys[0], one);
                expect(Buffer.from(result).toString("hex")).to.equal(
                    "0101010101010101010101010101010101010101010101010101010101010101",
                );
            });

            for (let i = 0; i < 10; i++) {
                it("random " + (i + 1), () => {
                    const sk = crypto.randomBytes(32);
                    const t = crypto.randomBytes(32);
                    secp256k1.privateKeyTweakMul(sk, t);
                });
            }
        });
    });
});
