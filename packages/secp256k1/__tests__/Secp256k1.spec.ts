/* eslint-disable @typescript-eslint/no-empty-function */
import { expect } from "chai";
import secp256k1 from "../lib";
import crypto from "crypto";

describe("Secp256k1", () => {
    const prvkeys = [Buffer.alloc(32, 0x01), Buffer.alloc(32, 0x02)];
    const pubkeys = prvkeys.map(p => secp256k1.publicKeyCreate(p, true));

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
                const prvkey = Buffer.from(
                    "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
                    "hex",
                );
                const pubkey = pubkeys[0];
                expect(() => secp256k1.ecdh(pubkey, prvkey)).to.throw(
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

            it("throws with invalid output type", () => {
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
});
