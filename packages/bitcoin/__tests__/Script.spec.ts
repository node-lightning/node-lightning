import { StreamReader } from "@node-lightning/bufio";
import * as crypto from "@node-lightning/crypto";
import { expect } from "chai";
import { Network } from "../lib/Network";
import { OpCode } from "../lib/OpCodes";
import { Script } from "../lib/Script";
import { ScriptCmd } from "../lib/ScriptCmd";
import { Fixture, testFixtures } from "./_TestHelper";

describe("Script", () => {
    describe("#number()", () => {
        const fixtures: Fixture<bigint, string>[] = [
            [0n, "OP 0x0"],
            [1n, "OP 0x51"],
            [16n, "OP 0x60"],
            [17n, "0x11"],
            [127n, "0x7f"],
            [128n, "0x8000"],
            [255n, "0xff00"],
            [65535n, "0xffff00"],
            [4294967295n, "0xffffffff00"],
            [4294967296n, "0x0000000001"],
            [-1n, "0x81"],
            [-255n, "0xff80"],
        ];

        const run = (input: bigint) => Script.number(input);

        const assert = (actual: ScriptCmd, expected: string) => {
            if (actual instanceof Buffer) {
                expect("0x" + actual.toString("hex")).to.equal(expected);
            } else {
                expect("OP 0x" + actual.toString(16)).to.equal(expected);
            }
        };

        testFixtures(fixtures, run, assert);
    });

    describe("#parse()", () => {
        it("happy path", () => {
            const sr = StreamReader.fromHex(
                "6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
            const script = Script.parse(sr);
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal(
                "304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a71601",
            );
            expect((script.cmds[1] as Buffer).toString("hex")).to.equal(
                "035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
        });

        it("op_code", () => {
            const sr = StreamReader.fromHex("0176");
            const script = Script.parse(sr);
            expect(script.cmds[0]).to.equal(OpCode.OP_DUP);
        });

        it("op_rawpushbytes", () => {
            const sr = StreamReader.fromHex("020100");
            const script = Script.parse(sr);
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal("00");
        });

        it("op_pushdata1", () => {
            const sr = StreamReader.fromHex("66" + "4c64" + "00".repeat(100));
            const script = Script.parse(sr);
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal("00".repeat(100));
        });

        it("op_pushdata2", () => {
            const sr = StreamReader.fromHex("fd0301" + "4d0001" + "00".repeat(256));
            const script = Script.parse(sr);
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal("00".repeat(256));
        });
    });

    describe(".equals()", () => {
        it("equal with cmds", () => {
            const script1 = new Script(OpCode.OP_3, OpCode.OP_ADD, OpCode.OP_4, OpCode.OP_EQUAL);
            const script2 = new Script(OpCode.OP_3, OpCode.OP_ADD, OpCode.OP_4, OpCode.OP_EQUAL);
            expect(script1.equals(script2)).to.equal(true);
        });

        it("equal with cmds and data", () => {
            const script1 = new Script(Buffer.from([0, 1, 2, 3]), OpCode.OP_EQUAL);
            const script2 = new Script(Buffer.from([0, 1, 2, 3]), OpCode.OP_EQUAL);
            expect(script1.equals(script2)).to.equal(true);
        });

        it("fails with length mismatch", () => {
            const script1 = new Script(OpCode.OP_4, OpCode.OP_EQUAL);
            const script2 = new Script(OpCode.OP_4);
            expect(script1.equals(script2)).to.equal(false);
        });

        it("fails with OP_CODE mismatch", () => {
            const script1 = new Script(OpCode.OP_EQUAL);
            const script2 = new Script(OpCode.OP_ADD);
            expect(script1.equals(script2)).to.equal(false);
        });

        it("fails with left type mismatch", () => {
            const script1 = new Script(Buffer.alloc(1, 0x01));
            const script2 = new Script(OpCode.OP_ADD);
            expect(script1.equals(script2)).to.equal(false);
        });

        it("fails with right type mismatch", () => {
            const script1 = new Script(OpCode.OP_ADD);
            const script2 = new Script(Buffer.alloc(1, 0x01));
            expect(script1.equals(script2)).to.equal(false);
        });

        it("fails with buffer value mismatch", () => {
            const script1 = new Script(Buffer.alloc(1, 0x01));
            const script2 = new Script(Buffer.alloc(1, 0x02));
            expect(script1.equals(script2)).to.equal(false);
        });
    });

    describe(".toString()", () => {
        it("with opcodes", () => {
            const script = new Script(
                OpCode.OP_DUP,
                OpCode.OP_HASH160,
                Buffer.from("00".repeat(20), "hex"),
                OpCode.OP_EQUALVERIFY,
                OpCode.OP_CHECKSIG,
            );
            expect(script.toString()).to.equal(
                "OP_DUP OP_HASH160 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG",
            );
        });

        it("with OP_PUSHBYTES", () => {
            const script = new Script(Buffer.from("00".repeat(75), "hex"));
            expect(script.toString()).to.equal("00".repeat(75));
        });

        it("with OP_PUSHDATA1", () => {
            const script = new Script(Buffer.from("00".repeat(76), "hex"));
            expect(script.toString()).to.equal("00".repeat(76));
        });

        it("with OP_PUSHDATA2", () => {
            const script = new Script(Buffer.from("00".repeat(256), "hex"));
            expect(script.toString()).to.equal("00".repeat(256));
        });
    });

    describe(".toJSON()", () => {
        it("with opcodes", () => {
            const script = new Script(
                OpCode.OP_DUP,
                OpCode.OP_HASH160,
                Buffer.from("00".repeat(20), "hex"),
                OpCode.OP_EQUALVERIFY,
                OpCode.OP_CHECKSIG,
            );
            expect(script.toJSON()).to.equal(
                "OP_DUP OP_HASH160 0000000000000000000000000000000000000000 OP_EQUALVERIFY OP_CHECKSIG",
            );
        });

        it("with OP_PUSHBYTES", () => {
            const script = new Script(Buffer.from("00".repeat(75), "hex"));
            expect(script.toJSON()).to.equal("00".repeat(75));
        });

        it("with OP_PUSHDATA1", () => {
            const script = new Script(Buffer.from("00".repeat(76), "hex"));
            expect(script.toJSON()).to.equal("00".repeat(76));
        });

        it("with OP_PUSHDATA2", () => {
            const script = new Script(Buffer.from("00".repeat(256), "hex"));
            expect(script.toJSON()).to.equal("00".repeat(256));
        });
    });

    describe(".serialize()", () => {
        it("happy path", () => {
            const script = new Script();
            script.cmds.push(
                Buffer.from(
                    "304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a71601",
                    "hex",
                ),
            );
            script.cmds.push(
                Buffer.from(
                    "035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
                    "hex",
                ),
            );
            expect(script.serialize().toString("hex")).to.equal(
                "6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
        });

        it("op_code", () => {
            const script = new Script(OpCode.OP_DUP);
            expect(script.serialize().toString("hex")).to.equal("0176");
        });

        it("op_rawpushbytes", () => {
            const script = new Script();
            script.cmds.push(Buffer.alloc(1));
            expect(script.serialize().toString("hex")).to.equal("020100");
        });

        it("op_pushdata1", () => {
            const script = new Script();
            script.cmds.push(Buffer.alloc(100));
            expect(script.serialize().toString("hex")).to.equal("66" + "4c64" + "00".repeat(100));
        });

        it("op_pushdata2", () => {
            const script = new Script();
            script.cmds.push(Buffer.alloc(256));
            expect(script.serialize().toString("hex")).to.equal(
                "fd0301" + "4d0001" + "00".repeat(256),
            );
        });
    });

    describe(".clone()", () => {
        it("clones via deep copy", () => {
            const a = new Script(Buffer.alloc(20, 0x01), OpCode.OP_EQUAL);
            const b = a.clone();

            // assert deep
            expect(a).to.not.equal(b);
            expect(a.cmds[0]).to.not.equal(b.cmds[0]);

            // assert values equailvalence
            expect(b.cmds[0]).to.deep.equal(b.cmds[0]);
            expect(b.cmds[1]).to.deep.equal(b.cmds[1]);
        });
    });

    describe(".toP2shAddress()", () => {
        it("generates base58 address", () => {
            const script = new Script(Buffer.alloc(20, 0x01), OpCode.OP_EQUAL);
            expect(script.toP2shAddress(Network.mainnet)).to.equal(
                "3NSBiLf9nZYqTbaNpZ4x2wUyFE6PzrbjtV",
            );
        });
    });

    describe(".toP2wshAddress()", () => {
        it("generates bech32 address", () => {
            const script = new Script(Buffer.alloc(20, 0x01), OpCode.OP_EQUAL);
            expect(script.toP2wshAddress(Network.mainnet)).to.equal(
                "bc1qea5g3xce0ht7qdxqpzktwwf826dez4fd6l8h2jnwxkym72sd7rwss23a2u",
            );
        });
    });

    describe("Factory Helpers", () => {
        // comp: 031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f
        // ucom: 041b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f70beaf8f588b541507fed6a642c5ab42dfdf8120a7f639de5122d47a69a8e8d1
        const privkeyA = Buffer.alloc(32, 1);

        // comp: 024d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d0766
        // ucom: 044d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d07662a3eada2d0fe208b6d257ceb0f064284662e857f57b66b54c198bd310ded36d0
        // const privkeyB = Buffer.alloc(32, 2);

        const invalidPubkey = Buffer.alloc(33);

        const aSignHello = Buffer.from(
            "304402207efc6629be179f7322378883507f434d2814a45369870795d538ca3497efb451022041640c6c86e4c7fd3d17eb859624e3fb37777d494eaf50fc0546b552bfcd2fbc",
            "hex",
        );

        const aSignHelloSigHash = Buffer.from(
            "304402207efc6629be179f7322378883507f434d2814a45369870795d538ca3497efb451022041640c6c86e4c7fd3d17eb859624e3fb37777d494eaf50fc0546b552bfcd2fbc01",
            "hex",
        );

        describe("#p2pkLock()", () => {
            const fixtures: Array<Fixture<Buffer, string>> = [
                {
                    title: "throws for invalid pubkey",
                    input: invalidPubkey,
                    throws: true,
                },
                {
                    title: "compressed pubkey",
                    input: crypto.getPublicKey(privkeyA, true),
                    expected:
                        "21031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078fac",
                },
                {
                    title: "uncompressed pubkey",
                    input: crypto.getPublicKey(privkeyA, false),
                    expected:
                        "41041b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f70beaf8f588b541507fed6a642c5ab42dfdf8120a7f639de5122d47a69a8e8d1ac",
                },
            ];

            const run = (input: Buffer) => Script.p2pkLock(input);

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });

        describe("#p2pkUnlock()", () => {
            const fixtures: Array<Fixture<Buffer, string>> = [
                {
                    title: "throws for invalid signature",
                    input: Buffer.alloc(32, 1),
                    throws: true,
                },
                {
                    title: "throws for missing sighash byte",
                    input: aSignHello,
                    throws: true,
                },
                {
                    title: "throws for invalid sighash byte",
                    input: Buffer.concat([aSignHello, Buffer.alloc(1, 20)]),
                    throws: true,
                },
                {
                    title: "correct key",
                    input: aSignHelloSigHash,
                    expected:
                        "47304402207efc6629be179f7322378883507f434d2814a45369870795d538ca3497efb451022041640c6c86e4c7fd3d17eb859624e3fb37777d494eaf50fc0546b552bfcd2fbc01",
                },
            ];

            const run = (input: Buffer) => Script.p2pkUnlock(input);

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });

        describe("#p2pkhLock()", () => {
            const fixtures = [
                {
                    title: "hash160",
                    input: Buffer.from("c34015187941b20ecda9378bb3cade86e80d2bfe", "hex"),
                    expected: "76a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac",
                },
                {
                    title: "compressed pubkey",
                    input: crypto.getPublicKey(privkeyA, true),
                    expected: "76a91479b000887626b294a914501a4cd226b58b23598388ac",
                },
                {
                    title: "uncompressed pubkey",
                    input: crypto.getPublicKey(privkeyA, false),
                    expected: "76a9146ff3443c994fb2c821969dae53bd5b5052d8394f88ac",
                },
                {
                    title: "invalid",
                    input: Buffer.alloc(32),
                    throws: true,
                },
            ];

            const run = (input: Buffer) => Script.p2pkhLock(input);

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });

        describe("#p2pkhUnlock()", () => {
            const fixtures = [
                {
                    title: "throws for invalid signature",
                    input: [Buffer.alloc(32, 1), crypto.getPublicKey(privkeyA)],
                    throws: true,
                },
                {
                    title: "throws for missing sighash byte",
                    input: [aSignHello, crypto.getPublicKey(privkeyA)],
                    throws: true,
                },
                {
                    title: "throws for invalid pubkey",
                    input: [aSignHelloSigHash, Buffer.alloc(1)],
                    throws: true,
                },
                {
                    title: "valid signature and compressed pubkey",
                    input: [aSignHelloSigHash, crypto.getPublicKey(privkeyA, true)],
                    expected:
                        "47304402207efc6629be179f7322378883507f434d2814a45369870795d538ca3497efb451022041640c6c86e4c7fd3d17eb859624e3fb37777d494eaf50fc0546b552bfcd2fbc0121031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f",
                },
                {
                    title: "valid signature and uncompressed pubkey",
                    input: [aSignHelloSigHash, crypto.getPublicKey(privkeyA, false)],
                    expected:
                        "47304402207efc6629be179f7322378883507f434d2814a45369870795d538ca3497efb451022041640c6c86e4c7fd3d17eb859624e3fb37777d494eaf50fc0546b552bfcd2fbc0141041b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f70beaf8f588b541507fed6a642c5ab42dfdf8120a7f639de5122d47a69a8e8d1",
                },
            ];

            const run = (input: Buffer[]) => Script.p2pkhUnlock(input[0], input[1]);

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });

        describe("#p2msLock()", () => {
            const fixtures = [
                {
                    title: "invalid pubkey",
                    input: {
                        m: 2,
                        pubkeys: [Buffer.alloc(33, 0), Buffer.alloc(33, 1)],
                    },
                    throws: true,
                },
                {
                    title: "requires at least 1 sig",
                    input: {
                        m: 0,
                        pubkeys: new Array(20)
                            .fill(undefined)
                            .map((u, i) => crypto.getPublicKey(Buffer.alloc(32, i + 1), true)),
                    },
                    throws: true,
                },
                {
                    title: "requires m be less than n",
                    input: {
                        m: 3,

                        pubkeys: new Array(2)
                            .fill(undefined)
                            .map((u, i) => crypto.getPublicKey(Buffer.alloc(32, i + 1), true)),
                    },
                    throws: true,
                },
                {
                    title: "requires n be 20 or fewer",
                    input: {
                        m: 2,
                        pubkeys: new Array(21)
                            .fill(undefined)
                            .map((u, i) => crypto.getPublicKey(Buffer.alloc(32, i + 1), true)),
                    },
                    throws: true,
                },
                {
                    title: "2 of 2 multisig",
                    input: {
                        m: 2,
                        pubkeys: [
                            Buffer.from(
                                "02e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f",
                                "hex",
                            ),
                            Buffer.from(
                                "02c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf18387",
                                "hex",
                            ),
                        ],
                    },
                    expected:
                        "522102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f2102c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf1838752ae",
                },
                {
                    title: "2 of 20 multisig",
                    input: {
                        m: 2,
                        pubkeys: new Array(20)
                            .fill(undefined)
                            .map((u, i) => crypto.getPublicKey(Buffer.alloc(32, i + 1), true)),
                    },
                    expected:
                        "52\
21031b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f\
21024d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d0766\
2102531fe6068134503d2723133227c867ac8fa6c83c537e9a44c3c5bdbdcb1fe337\
2103462779ad4aad39514614751a71085f2f10e1c7a593e4e030efb5b8721ce55b0b\
210362c0a046dacce86ddd0343c6d3c7c79c2208ba0d9c9cf24a6d046d21d21f90f7\
2103f006a18d5653c4edf5391ff23a61f03ff83d237e880ee61187fa9f379a028e0a\
2102989c0b76cb563971fdc9bef31ec06c3560f3249d6ee9e5d83c57625596e05f6f\
2103f991f944d1e1954a7fc8b9bf62e0d78f015f4c07762d505e20e6c45260a3661b\
210256b328b30c8bf5839e24058747879408bdb36241dc9c2e7c619faa12b2920967\
2103f76a39d05686e34a4420897e359371836145dd3973e3982568b60f8433adde6e\
2102552c630b64b54bf50210c9e253d38bd4949c72e22873500f6285c2bede312a84\
21030f0fb9a244ad31a369ee02b7abfbbb0bfa3812b9a39ed93346d03d67d412d177\
21022f1b310f4c065331bc0d79ba4661bb9822d67d7c4a1b0a1892e1fd0cd23aa68d\
210299c2aa85d2b21a62f396907a802a58e521dafd5bddaccbd72786eea189bc4dc9\
21021a7a569e91dbf60581509c7fc946d1003b60c7dee85299538db6353538d59574\
2103a92c9b7cac68758de5783ed8e5123598e4ad137091e42987d3bad8a08e35bf3d\
21034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa\
21036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f7\
21031d16453b3ab3132acb0a5bc16cc49690d819a585267a15cd5a064e2a0ad40599\
2103ff8adab52623bcb2717fc71d7edc6f55e98396e6c234dff01f307a12b2af1c99\
0114\
ae",
                },
            ];

            const run = (input: { m: number; pubkeys: Buffer[] }) => {
                const { m, pubkeys } = input;
                return Script.p2msLock(m, ...pubkeys);
            };

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });

        describe("#p2msUnlock()", () => {
            const fixtures = [
                {
                    title: "invalid sig buffer fails",
                    input: {
                        sigs: [Buffer.alloc(32, 1)],
                    },
                    throws: true,
                },
                {
                    title: "invalid sig hash type fails",
                    input: {
                        sigs: [Buffer.concat([aSignHello, Buffer.alloc(1, 20)])],
                    },
                    throws: true,
                },
                {
                    title: "1 of 2 multisig",
                    input: {
                        sigs: [aSignHelloSigHash],
                    },
                    expected:
                        "0047304402207efc6629be179f7322378883507f434d2814a45369870795d538ca3497efb451022041640c6c86e4c7fd3d17eb859624e3fb37777d494eaf50fc0546b552bfcd2fbc01",
                },
            ];

            const run = (input: { sigs: Buffer[] }) => {
                const { sigs } = input;
                return Script.p2msUnlock(...sigs);
            };

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });

        describe("#p2shLock()", () => {
            const fixtures: Array<Fixture<Script | Buffer, string>> = [
                {
                    title: "invalid hash length",
                    input: Buffer.alloc(19),
                    throws: true,
                },
                {
                    title: "non-standard script",
                    input: new Script(
                        OpCode.OP_SHA256,
                        Buffer.from(
                            "253c853e2915f5979e3c6b248b028cc5e3b4e7be3d0884db6c3632fd85702def",
                            "hex",
                        ),
                        OpCode.OP_EQUAL,
                    ),
                    expected: "a9140714c97d999d7e3f1c68b015fec735b857e9064987",
                },
                {
                    title: "non-standard hash160",
                    input: crypto.hash160(
                        new Script(
                            OpCode.OP_SHA256,
                            Buffer.from(
                                "253c853e2915f5979e3c6b248b028cc5e3b4e7be3d0884db6c3632fd85702def",
                                "hex",
                            ),
                            OpCode.OP_EQUAL,
                        ).serializeCmds(),
                    ),
                    expected: "a9140714c97d999d7e3f1c68b015fec735b857e9064987",
                },
                {
                    title: "p2sh(p2ms) script",
                    input: crypto.hash160(
                        Buffer.from(
                            "522102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f2102c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf1838752ae",
                            "hex",
                        ),
                    ),
                    expected: "a91451a92be9c57d4b865e69daad982c5ab6c1d7bea187",
                },
                {
                    title: "p2sh(p2pkh) script",
                    input: crypto.hash160(
                        Buffer.from("76a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac", "hex"),
                    ),
                    expected: "a91421478d4f1adfe18d59ccb5ca0e135fa6a5f3467687",
                },
            ];

            const run = (input: Buffer | Script) => Script.p2shLock(input);

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });

        describe("#p2shUnlock", () => {
            const fixtures: Array<Fixture<[Script, Script] | [Script, ...ScriptCmd[]], string>> = [
                {
                    title: "no extra data",
                    input: [new Script(OpCode.OP_1), undefined],
                    expected: "0151",
                },
                {
                    title: "extra data as Script",
                    input: [new Script(OpCode.OP_EQUAL), new Script(OpCode.OP_1, OpCode.OP_1)],
                    expected: "51510187",
                },
                {
                    title: "extra data as ScriptCmd",
                    input: [new Script(OpCode.OP_EQUAL), OpCode.OP_1, OpCode.OP_1],
                    expected: "51510187",
                },
            ];

            const run = ([script, ...rest]: [Script, Script] | [Script, ...ScriptCmd[]]) => {
                if (rest[0] instanceof Script) {
                    return Script.p2shUnlock(script, rest[0]);
                } else {
                    return Script.p2shUnlock(script, ...(rest as ScriptCmd[]));
                }
            };

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });

        describe("#p2wpkhLock()", () => {
            const fixtures: Array<Fixture<Buffer, string>> = [
                {
                    title: "invalid pubkey fails",
                    input: invalidPubkey,
                    throws: true,
                },
                {
                    title: "hash160 input",
                    input: Buffer.from("c34015187941b20ecda9378bb3cade86e80d2bfe", "hex"),
                    expected: "0014c34015187941b20ecda9378bb3cade86e80d2bfe",
                },
                {
                    title: "compressed pubkey",
                    input: crypto.getPublicKey(privkeyA, true),
                    expected: "001479b000887626b294a914501a4cd226b58b235983",
                },
                {
                    title: "uncompressed pubkey",
                    input: crypto.getPublicKey(privkeyA, false),
                    expected: "00146ff3443c994fb2c821969dae53bd5b5052d8394f",
                },
            ];

            const run = (input: Buffer) => Script.p2wpkhLock(input);

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });

        describe("#p2wshLock", () => {
            const fixtures: Array<Fixture<Buffer | Script, string>> = [
                {
                    title: "bad buffer throws",
                    input: Buffer.alloc(30),
                    throws: true,
                },
                {
                    title: "buffer input",
                    input: Buffer.from(
                        "0000000000000000000000000000000000000000000000000000000000000000",
                        "hex",
                    ),
                    expected:
                        "00200000000000000000000000000000000000000000000000000000000000000000",
                },
                {
                    title: "script input",
                    input: Script.p2pkhLock(crypto.getPublicKey(privkeyA, true)),
                    expected:
                        "00206f1b349d7fed5240ad719948529e8b06abf038438f9b523820489375af513a3f",
                },
            ];

            const run = (input: Buffer | Script) => Script.p2wshLock(input);

            const assert = (actual: Script, expected: string) => {
                expect(actual.serializeCmds().toString("hex")).to.equal(expected);
            };

            testFixtures(fixtures, run, assert);
        });
    });
});
