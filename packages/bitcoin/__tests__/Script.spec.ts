import { bufToStream } from "@lntools/buffer-cursor";
import { expect } from "chai";
import { Script } from "../lib/Script";
import { OpCode } from "../lib/script/OpCodes";

describe("Script", () => {
    describe(".parse()", () => {
        it("happy patth", () => {
            const data = Buffer.from("6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937", "hex"); // prettier-ignore
            const stream = bufToStream(data);
            const script = Script.parse(stream);
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal(
                "304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a71601",
            );
            expect((script.cmds[1] as Buffer).toString("hex")).to.equal(
                "035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
        });

        it("op_code", () => {
            const buf = Buffer.from("0176", "hex");
            const script = Script.parse(bufToStream(buf));
            expect(script.cmds[0]).to.equal(OpCode.OP_DUP);
        });

        it("op_rawpushbytes", () => {
            const buf = Buffer.from("020100", "hex");
            const script = Script.parse(bufToStream(buf));
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal("00");
        });

        it("op_pushdata1", () => {
            const buf = Buffer.from("66" + "4c64" + "00".repeat(100), "hex");
            const script = Script.parse(bufToStream(buf));
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal("00".repeat(100));
        });

        it("op_pushdata2", () => {
            const buf = Buffer.from("fd0301" + "4d0001" + "00".repeat(256), "hex");
            const script = Script.parse(bufToStream(buf));
            expect((script.cmds[0] as Buffer).toString("hex")).to.equal("00".repeat(256));
        });
    });

    describe(".toBuffer()", () => {
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
            expect(script.toBuffer().toString("hex")).to.equal(
                "6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
        });

        it("op_code", () => {
            const script = new Script(OpCode.OP_DUP);
            expect(script.toBuffer().toString("hex")).to.equal("0176");
        });

        it("op_rawpushbytes", () => {
            const script = new Script();
            script.cmds.push(Buffer.alloc(1));
            expect(script.toBuffer().toString("hex")).to.equal("020100");
        });

        it("op_pushdata1", () => {
            const script = new Script();
            script.cmds.push(Buffer.alloc(100));
            expect(script.toBuffer().toString("hex")).to.equal("66" + "4c64" + "00".repeat(100));
        });

        it("op_pushdata2", () => {
            const script = new Script();
            script.cmds.push(Buffer.alloc(256));
            expect(script.toBuffer().toString("hex")).to.equal(
                "fd0301" + "4d0001" + "00".repeat(256),
            );
        });
    });
});
