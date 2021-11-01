import { expect } from "chai";
import { HdKeyType } from "../lib";
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
    });

    describe(".fromPath()", () => {
        const seed = Buffer.alloc(32, 0x01);
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
});
