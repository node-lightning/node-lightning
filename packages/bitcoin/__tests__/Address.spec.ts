import { expect } from "chai";
import { Address } from "../lib/Address";
import { Network } from "../lib/Network";
import { Script } from "../lib/Script";
import { OpCode, PrivateKey } from "../lib";
import { AddressType } from "../lib/AddressType";

describe("Address", () => {
    describe(Address.fromStr.name, () => {
        it("valid P2PKH", () => {
            const decoded = Address.fromStr("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH");
            expect(decoded.type).to.equal(AddressType.P2pkh);
        });

        it("valid P2SH", () => {
            const decoded = Address.fromStr("3MaB7QVq3k4pQx3BhsvEADgzQonLSBwMdj");
            expect(decoded.type).to.equal(AddressType.P2sh);
        });

        it("valid P2WPKH", () => {
            const decoded = Address.fromStr("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
            expect(decoded.type).to.equal(AddressType.P2wpkh);
        });

        it("valid P2WPKH", () => {
            const decoded = Address.fromStr("BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4");
            expect(decoded.type).to.equal(AddressType.P2wpkh);
        });

        it("valid P2WSH", () => {
            const decoded = Address.fromStr(
                "bc1qft5p2uhsdcdc3l2ua4ap5qqfg4pjaqlp250x7us7a8qqhrxrxfsq2gp3gp",
            );
            expect(decoded.type).to.equal(AddressType.P2wsh);
        });

        it("valid P2WSH", () => {
            const decoded = Address.fromStr(
                "BC1QFT5P2UHSDCDC3L2UA4AP5QQFG4PJAQLP250X7US7A8QQHRXRXFSQ2GP3GP",
            );
            expect(decoded.type).to.equal(AddressType.P2wsh);
        });
    });

    describe(".encodeBase58()", () => {
        it("throws on invalid hash length", () => {
            const input = Buffer.alloc(32);
            expect(() => Address.encodeBase58(0, input)).to.throw();
        });

        it("encode P2PKH uncompressed", () => {
            const prvKey = new PrivateKey(
                Buffer.from(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                    "hex",
                ),
                Network.mainnet,
            );
            const address = Address.encodeBase58(
                Network.mainnet.p2pkhPrefix,
                prvKey.toPubKey(false).hash160(),
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
            const address = Address.encodeBase58(
                Network.mainnet.p2pkhPrefix,
                prvKey.toPubKey(true).hash160(),
            );
            expect(address).to.equal("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH");
        });

        it("encode P2SH", () => {
            const script = new Script(OpCode.OP_1);
            const address = Address.encodeBase58(Network.mainnet.p2shPrefix, script.hash160());
            expect(address).to.to.equal("3MaB7QVq3k4pQx3BhsvEADgzQonLSBwMdj");
        });
    });

    describe(".decodeBase58()", () => {
        it("throws invalid hash length", () => {
            expect(() => Address.decodeBase58("11111111111111111111111111111111273Yts")).to.throw(
                "Hash160 requires 20-byte Buffer",
            );
        });

        it("throws invalid checksum", () => {
            expect(() => Address.decodeBase58("1111111111111111111114oLvT3")).to.throw(
                "Base58Check checksum failed",
            );
        });

        it("throws invalid network", () => {
            expect(() => Address.decodeBase58("thyfTvitmEyfHSE7kDN1zHj4sfZraSC9ES")).to.throw(
                "Unknown address prefix",
            );
        });

        it("decode P2PKH", () => {
            const decoded = Address.decodeBase58("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH");
            expect(decoded.type).to.equal(AddressType.P2pkh);
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
                    .toPubKey(true)
                    .hash160()
                    .toString("hex"),
            );
        });

        it("decode P2SH", () => {
            const decoded = Address.decodeBase58("3MaB7QVq3k4pQx3BhsvEADgzQonLSBwMdj");
            expect(decoded.type).to.equal(AddressType.P2sh);
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

    describe(".encodeBech32()", () => {
        it("encode P2WPKH", () => {
            const prvKey = new PrivateKey(
                Buffer.from(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                    "hex",
                ),
                Network.mainnet,
            );
            const program = prvKey.toPubKey(true).hash160();
            const address = Address.encodeBech32(Network.mainnet.p2wpkhPrefix, 0, program);
            expect(address).to.equal("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
        });

        it("encode P2WSH", () => {
            const script = new Script(OpCode.OP_1);
            const program = script.sha256();
            const address = Address.encodeBech32(Network.mainnet.p2wshPrefix, 0, program);
            expect(address).to.equal(
                "bc1qft5p2uhsdcdc3l2ua4ap5qqfg4pjaqlp250x7us7a8qqhrxrxfsq2gp3gp",
            );
        });
    });

    describe(".decodeBech32()", () => {
        it("throws with invalid version", () => {
            expect(() =>
                Address.decodeBech32("bc13qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6tctp0"),
            ).to.throw("Unknown segwit version");
        });

        it("throws with invalid version 0 program", () => {
            expect(() =>
                Address.decodeBech32("bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqquxykp3"),
            ).to.throw("Invalid witness program");
        });

        it("throws with invalid checksum", () => {
            expect(() =>
                Address.decodeBech32("bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9e75rr"),
            ).to.throw("Invalid bech32 checksum");
        });

        it("throws with unknown network", () => {
            expect(() =>
                Address.decodeBech32("bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtfyrcj"),
            ).to.throw("Unknown address prefix");
        });

        it("decode P2WPKH", () => {
            const decoded = Address.decodeBech32("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
            expect(decoded.type).to.equal(AddressType.P2wpkh);
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
            const decoded = Address.decodeBech32(
                "bc1qft5p2uhsdcdc3l2ua4ap5qqfg4pjaqlp250x7us7a8qqhrxrxfsq2gp3gp",
            );
            expect(decoded.type).to.equal(AddressType.P2wsh);
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
                    const decoded = Address.decodeBech32(encoded);
                    const script = new Script(decoded.version, decoded.program);
                    expect(script.serializeCmds().toString("hex")).to.equal(lockScript);
                });
            }
        });

        describe("BIP350 Vectors", () => {
            const vectors = [
                [
                    "BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4",
                    "0014751e76e8199196d454941c45d1b3a323f1433bd6",
                ],
                [
                    "tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7",
                    "00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262",
                ],
                [
                    "bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kt5nd6y",
                    "5128751e76e8199196d454941c45d1b3a323f1433bd6751e76e8199196d454941c45d1b3a323f1433bd6",
                ],
                ["BC1SW50QGDZ25J", "6002751e"],
                ["bc1zw508d6qejxtdg4y5r3zarvaryvaxxpcs", "5210751e76e8199196d454941c45d1b3a323"],
                [
                    "tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesrxh6hy",
                    "0020000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433",
                ],
                [
                    "tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c",
                    "5120000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433",
                ],
                [
                    "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0",
                    "512079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
                ],
            ];

            for (const [address, scriptPubKey] of vectors) {
                it(`${address} => ${scriptPubKey}`, () => {
                    const decoded = Address.decodeBech32(address);
                    const script = new Script(Script.number(decoded.version), decoded.program);
                    expect(script.serializeCmds().toString("hex")).to.equal(scriptPubKey);
                });
            }
        });

        describe("BIP350 Vectors (Invalid)", () => {
            const vectors = [
                [
                    "tc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq5zuyut",
                    "Invalid human-readable part",
                ],
                [
                    "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqh2y7hd",
                    "Invalid checksum (Bech32 instead of Bech32m)",
                ],
                [
                    "tb1z0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqglt7rf",
                    "Invalid checksum (Bech32 instead of Bech32m)",
                ],
                [
                    "BC1S0XLXVLHEMJA6C4DQV22UAPCTQUPFHLXM9H8Z3K2E72Q4K9HCZ7VQ54WELL",
                    "Invalid checksum (Bech32 instead of Bech32m)",
                ],
                [
                    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kemeawh",
                    "Invalid checksum (Bech32m instead of Bech32)",
                ],
                [
                    "tb1q0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq24jc47",
                    "Invalid checksum (Bech32m instead of Bech32)",
                ],
                [
                    "bc1p38j9r5y49hruaue7wxjce0updqjuyyx0kh56v8s25huc6995vvpql3jow4",
                    "Invalid character in checksum",
                ],
                [
                    "BC130XLXVLHEMJA6C4DQV22UAPCTQUPFHLXM9H8Z3K2E72Q4K9HCZ7VQ7ZWS8R",
                    "Invalid witness version",
                ],
                ["bc1pw5dgrnzv", "Invalid program length (1 byte)"],
                [
                    "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7v8n0nx0muaewav253zgeav",
                    "Invalid program length (41 bytes)",
                ],
                [
                    "BC1QR508D6QEJXTDG4Y5R3ZARVARYV98GJ9P",
                    "Invalid program length for witness version 0 (per BIP141)",
                ],
                ["tb1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq47Zagq", "Mixed case"],
                [
                    "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7v07qwwzcrf",
                    "zero padding of more than 4 bits",
                ],
                [
                    "tb1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vpggkg4j",
                    "Non-zero padding in 8-to-5 conversion",
                ],
                ["bc1gmk9yu", "Empty data section"],
            ];

            for (const [address, error] of vectors) {
                it(`${address} (${error})`, () => {
                    expect(() => Address.decodeBech32(address)).to.throw();
                });
            }
        });
    });
});
