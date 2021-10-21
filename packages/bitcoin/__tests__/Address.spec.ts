import { expect } from "chai";
import { Address } from "../lib/Address";
import { Network } from "../lib/Network";
import { Script } from "../lib/Script";
import { OpCode, PrivateKey } from "../lib";

describe("Address", () => {
    describe(".encodeLegacy()", () => {
        it("throws on invalid hash length", () => {
            const input = Buffer.alloc(32);
            expect(() => Address.encodeLegacy(0, input)).to.throw();
        });

        it("encode P2PKH uncompressed", () => {
            const prvKey = new PrivateKey(
                Buffer.from(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                    "hex",
                ),
                Network.mainnet,
            );
            const address = Address.encodeLegacy(
                Network.mainnet.p2pkhPrefix,
                prvKey.toPubKey().hash160(false),
            );
            expect(address).to.equal("1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm");
        });

        it("encode P2PKH compressed", () => {
            const prvKey = new PrivateKey(
                Buffer.from(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                    "hex",
                ),
                Network.mainnet,
            );
            const address = Address.encodeLegacy(
                Network.mainnet.p2pkhPrefix,
                prvKey.toPubKey().hash160(true),
            );
            expect(address).to.equal("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH");
        });

        it("encode P2SH", () => {
            const script = new Script(OpCode.OP_1);
            const address = Address.encodeLegacy(Network.mainnet.p2shPrefix, script.hash160());
            expect(address).to.to.equal("3MaB7QVq3k4pQx3BhsvEADgzQonLSBwMdj");
        });
    });

    describe(".decodeLegacy()", () => {
        it("throws invalid hash length", () => {
            expect(() => Address.decodeLegacy("11111111111111111111111111111111273Yts")).to.throw(
                "Hash160 requires 20-byte Buffer",
            );
        });

        it("throws invalid checksum", () => {
            expect(() => Address.decodeLegacy("1111111111111111111114oLvT3")).to.throw(
                "Base58Check checksum failed",
            );
        });

        it("throws invalid network", () => {
            expect(() => Address.decodeLegacy("thyfTvitmEyfHSE7kDN1zHj4sfZraSC9ES")).to.throw(
                "Unknown address prefix",
            );
        });

        it("decode P2PKH", () => {
            const decoded = Address.decodeLegacy("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH");
            expect(decoded.network).to.equal(Network.mainnet);
            expect(decoded.prefix).to.equal(Network.mainnet.p2pkhPrefix);
            expect(decoded.hash.toString("hex")).to.equal(
                "751e76e8199196d454941c45d1b3a323f1433bd6",
            );
            expect(decoded.hash.toString("hex")).to.equal(
                new PrivateKey(
                    Buffer.from(
                        "0000000000000000000000000000000000000000000000000000000000000001",
                        "hex",
                    ),
                    Network.mainnet,
                )
                    .toPubKey()
                    .hash160(true)
                    .toString("hex"),
            );
        });

        it("decode P2SH", () => {
            const decoded = Address.decodeLegacy("3MaB7QVq3k4pQx3BhsvEADgzQonLSBwMdj");
            expect(decoded.network).to.equal(Network.mainnet);
            expect(decoded.prefix).to.equal(Network.mainnet.p2shPrefix);
            expect(decoded.hash.toString("hex")).to.equal(
                "da1745e9b549bd0bfa1a569971c77eba30cd5a4b",
            );
            expect(decoded.hash.toString("hex")).to.equal(
                new Script(OpCode.OP_1).hash160().toString("hex"),
            );
        });
    });

    describe(".encodeSegwit()", () => {
        it("encode P2WPKH", () => {
            const prvKey = new PrivateKey(
                Buffer.from(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                    "hex",
                ),
                Network.mainnet,
            );
            const program = prvKey.toPubKey().hash160(true);
            const address = Address.encodeSegwit(Network.mainnet.p2wpkhPrefix, 0, program);
            expect(address).to.equal("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
        });

        it("encode P2WSH", () => {
            const script = new Script(OpCode.OP_1);
            const program = script.sha256();
            const address = Address.encodeSegwit(Network.mainnet.p2wshPrefix, 0, program);
            expect(address).to.equal(
                "bc1qft5p2uhsdcdc3l2ua4ap5qqfg4pjaqlp250x7us7a8qqhrxrxfsq2gp3gp",
            );
        });
    });

    describe(".decodeSegwit()", () => {
        it("throws with invalid version", () => {
            expect(() =>
                Address.decodeSegwit("bc13qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6tctp0"),
            ).to.throw("Unknown segwit version");
        });

        it("throws with invalid version 0 program", () => {
            expect(() =>
                Address.decodeSegwit("bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqquxykp3"),
            ).to.throw("Invalid witness program");
        });

        it("throws with invalid checksum", () => {
            expect(() =>
                Address.decodeSegwit("bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9e75rr"),
            ).to.throw("Invalid bech32 checksum");
        });

        it("throws with unknown network", () => {
            expect(() =>
                Address.decodeSegwit("bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtfyrcj"),
            ).to.throw("Unknown address prefix");
        });

        it("decode P2WPKH", () => {
            const decoded = Address.decodeSegwit("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
            expect(decoded.network).to.equal(Network.mainnet);
            expect(decoded.version).to.equal(0);
            expect(decoded.program.toString("hex")).to.equal(
                "751e76e8199196d454941c45d1b3a323f1433bd6",
            );
            expect(
                Script.p2wpkhLock(decoded.program)
                    .serializeCmds()
                    .toString("hex"),
            ).to.equal("0014751e76e8199196d454941c45d1b3a323f1433bd6");
        });

        it("decode P2WSH", () => {
            const decoded = Address.decodeSegwit(
                "bc1qft5p2uhsdcdc3l2ua4ap5qqfg4pjaqlp250x7us7a8qqhrxrxfsq2gp3gp",
            );
            expect(decoded.network).to.equal(Network.mainnet);
            expect(decoded.version).to.equal(0);
            expect(decoded.program.toString("hex")).to.equal(
                "4ae81572f06e1b88fd5ced7a1a000945432e83e1551e6f721ee9c00b8cc33260",
            );
            expect(decoded.program.toString("hex")).to.equal(
                new Script(OpCode.OP_1).sha256().toString("hex"),
            );
        });

        describe("BIP173 Vectors", () => {
            const tests: [string, string][] = [
                [
                    "BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4",
                    "0014751e76e8199196d454941c45d1b3a323f1433bd6",
                ],
                [
                    "tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7",
                    "00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262",
                ],
            ];

            for (const [encoded, lockScript] of tests) {
                it(`${encoded} => ${lockScript}`, () => {
                    const decoded = Address.decodeSegwit(encoded);
                    const script = new Script(decoded.version, decoded.program);
                    expect(script.serializeCmds().toString("hex")).to.equal(lockScript);
                });
            }
        });
    });
});
