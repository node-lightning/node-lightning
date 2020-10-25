import { StreamReader } from "@node-lightning/bufio";
import { hash160 } from "@node-lightning/crypto";
import { expect } from "chai";
import { OpCode } from "../lib/OpCodes";
import { Script } from "../lib/Script";

describe("Script", () => {
    describe("#parse()", () => {
        it("happy path", () => {
            const sr = StreamReader.fromHex("6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937");
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
});

describe("Script.p2msLock", () => {
    const fixtures: any = [
        {
            assert: "2 of 2 multisig",
            input: {
                m: 2,
                n: 2,
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
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const { m, n, pubkeys } = input;
            const actual = Script.p2msLock(m, n, pubkeys);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});

describe("Script.p2pkhLock", () => {
    const fixtures = [
        {
            assert: "standard script",
            input: Buffer.from("c34015187941b20ecda9378bb3cade86e80d2bfe", "hex"),
            expected: "76a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac",
        },
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const actual = Script.p2pkhLock(input);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});

describe("Script.p2shLock", () => {
    const fixtures = [
        {
            assert: "non-standard script",
            input: hash160(
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
            assert: "p2sh(p2ms) script",
            input: hash160(
                Buffer.from(
                    "522102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f2102c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf1838752ae",
                    "hex",
                ),
            ),
            expected: "a91451a92be9c57d4b865e69daad982c5ab6c1d7bea187",
        },
        {
            assert: "p2sh(p2pkh) script",
            input: hash160(
                Buffer.from("76a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac", "hex"),
            ),
            expected: "a91421478d4f1adfe18d59ccb5ca0e135fa6a5f3467687",
        },
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const actual = Script.p2shLock(input);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});

describe("Script.p2wpkhLock", () => {
    const fixtures = [
        {
            assert: "standard script",
            input: Buffer.from("c34015187941b20ecda9378bb3cade86e80d2bfe", "hex"),
            expected: "0014c34015187941b20ecda9378bb3cade86e80d2bfe",
        },
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const actual = Script.p2wpkhLock(input);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});

describe("Script.p2wshLock", () => {
    const fixtures = [
        {
            assert: "standard script",
            input: Buffer.from(
                "0000000000000000000000000000000000000000000000000000000000000000",
                "hex",
            ),
            expected: "00200000000000000000000000000000000000000000000000000000000000000000",
        },
    ];

    for (const { assert, input, expected } of fixtures) {
        it(assert, () => {
            const actual = Script.p2wpkhLock(input);
            expect(actual.serializeCmds().toString("hex")).to.equal(expected);
        });
    }
});
