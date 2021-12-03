import { expect } from "chai";
import secp256k1 from "../lib";

describe("Secp256k1", () => {
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
                const privateKey = Buffer.alloc(32, 0x01);
                const publicKey = null;
                expect(() => secp256k1.ecdh(publicKey, privateKey)).to.throw(
                    "Expected public key to be an Uint8Array",
                );
            });

            it("throws with invalid length pubkey", () => {
                const privateKey = Buffer.alloc(32, 0x01);
                const publicKey = secp256k1.publicKeyCreate(privateKey, true).slice(1);
                expect(() => secp256k1.ecdh(publicKey, privateKey)).to.throw(
                    "Expected public key to be an Uint8Array with length [33, 65]",
                );
            });

            it("throws with invalid public key", () => {
                const privateKey = Buffer.alloc(32, 0x01);
                const publicKey = secp256k1.publicKeyCreate(privateKey, true);
                publicKey[0] = 0x01;
                expect(() => secp256k1.ecdh(publicKey, privateKey)).to.throw(
                    "Public Key could not be parsed",
                );
            });
        });

        describe("arg: invalid private key", () => {
            it("throws null value", () => {
                const privateKey = null;
                const publicKey = secp256k1.publicKeyCreate(Buffer.alloc(32, 0x01), true);
                expect(() => secp256k1.ecdh(publicKey, privateKey)).to.throw(
                    "Expected private key to be an Uint8Array",
                );
            });

            it("throws invalid length", () => {
                const privateKey = Buffer.alloc(31, 0x01);
                const publicKey = secp256k1.publicKeyCreate(Buffer.alloc(32, 0x01), true);
                expect(() => secp256k1.ecdh(publicKey, privateKey)).to.throw(
                    "Expected private key to be an Uint8Array with length 32",
                );
            });

            it("throws when private key is zero", () => {
                const privateKey = Buffer.alloc(32);
                const publicKey = secp256k1.publicKeyCreate(Buffer.alloc(32, 0x01), true);
                expect(() => secp256k1.ecdh(publicKey, privateKey)).to.throw(
                    "Scalar was invalid (zero or overflow)",
                );
            });

            it("throws when private key >= N", () => {
                const privateKey = Buffer.from(
                    "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
                    "hex",
                );
                const publicKey = secp256k1.publicKeyCreate(Buffer.alloc(32, 0x01), true);
                expect(() => secp256k1.ecdh(publicKey, privateKey)).to.throw(
                    "Scalar was invalid (zero or overflow",
                );
            });
        });

        describe("args: valid", () => {
            it("reciprical match", () => {
                const sk1 = Buffer.alloc(32, 0x01);
                const sk2 = Buffer.alloc(32, 0x02);
                const pk1 = secp256k1.publicKeyCreate(sk1, true);
                const pk2 = secp256k1.publicKeyCreate(sk2, true);

                const r1 = secp256k1.ecdh(pk1, sk2);
                const r2 = secp256k1.ecdh(pk2, sk1);

                expect(r1).to.deep.equal(r2);
            });
        });
    });
});
