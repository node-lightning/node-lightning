import { StreamReader } from "@node-lightning/bufio";
import { expect } from "chai";
import { ScriptBuf } from "../lib";
import { Network } from "../lib/Network";
import { OpCode } from "../lib/OpCodes";
import { Script } from "../lib/Script";

describe("ScriptBuf", () => {
    describe("#parse()", () => {
        it("reads executable script", () => {
            const buf = Buffer.from(
                "69304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
                "hex",
            );
            const script = ScriptBuf.parse(StreamReader.fromBuffer(buf));
            expect(script.buffer.toString("hex")).to.equal(
                "304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
        });

        it("reads unexecutable script", () => {
            const sr = StreamReader.fromHex(
                "580312b90b1b4d696e656420627920416e74506f6f6c3835323601ff0076dcc16ffabe6d6db88c7cf9261b1b9811d47e594bbf0928d66444efb12e9bd1924d675879d25dfb02000000000000000000b6233400000000070000",
            );
            const scriptBuf = ScriptBuf.parse(sr);
            expect(scriptBuf.buffer.toString("hex")).to.equal(
                "0312b90b1b4d696e656420627920416e74506f6f6c3835323601ff0076dcc16ffabe6d6db88c7cf9261b1b9811d47e594bbf0928d66444efb12e9bd1924d675879d25dfb02000000000000000000b6233400000000070000",
            );
        });
    });

    describe(".equals()", () => {
        it("true when equal bufs", () => {
            const a = new ScriptBuf(Buffer.alloc(32, 0x01));
            const b = new ScriptBuf(Buffer.alloc(32, 0x01));
            expect(a.equals(b)).to.equal(true);
        });

        it("false when different lengths", () => {
            const a = new ScriptBuf(Buffer.alloc(32, 0x01));
            const b = new ScriptBuf(Buffer.alloc(33, 0x01));
            expect(a.equals(b)).to.equal(false);
        });

        it("false when different buffers", () => {
            const a = new ScriptBuf(Buffer.alloc(32, 0x01));
            const b = new ScriptBuf(Buffer.alloc(32, 0x02));
            expect(a.equals(b)).to.equal(false);
        });
    });

    describe(".toString()", () => {
        it("outputs hex", () => {
            const script = new ScriptBuf(
                Buffer.from("79a914000000000000000000000000000000000000000088ac", "hex"),
            );
            expect(script.toString()).to.equal(
                "79a914000000000000000000000000000000000000000088ac",
            );
        });
    });

    describe(".toJSON()", () => {
        it("outputs hex", () => {
            const script = new ScriptBuf(
                Buffer.from("79a914000000000000000000000000000000000000000088ac", "hex"),
            );
            expect(script.toString()).to.equal(
                "79a914000000000000000000000000000000000000000088ac",
            );
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
            const buf = ScriptBuf.fromScript(script);
            expect(buf.serialize().toString("hex")).to.equal(
                "6a47304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a7160121035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937",
            );
        });
    });

    describe(".clone()", () => {
        it("clones via deep copy", () => {
            const a = new ScriptBuf(Buffer.alloc(20, 0x01));
            const b = a.clone();

            // assert deep
            expect(a).to.not.equal(b);
            expect(a.buffer).to.not.equal(b.buffer);

            // assert values equivalence
            expect(b.buffer).to.deep.equal(b.buffer);
        });
    });

    describe(".toP2shAddress()", () => {
        it("generates base58 address", () => {
            const script = ScriptBuf.fromScript([Buffer.alloc(20, 0x01), OpCode.OP_EQUAL]);
            expect(script.toP2shAddress(Network.mainnet)).to.equal(
                "3NSBiLf9nZYqTbaNpZ4x2wUyFE6PzrbjtV",
            );
        });
    });

    describe(".toP2wshAddress()", () => {
        it("generates bech32 address", () => {
            const script = ScriptBuf.fromScript([Buffer.alloc(20, 0x01), OpCode.OP_EQUAL]);
            expect(script.toP2wshAddress(Network.mainnet)).to.equal(
                "bc1qea5g3xce0ht7qdxqpzktwwf826dez4fd6l8h2jnwxkym72sd7rwss23a2u",
            );
        });
    });
});
