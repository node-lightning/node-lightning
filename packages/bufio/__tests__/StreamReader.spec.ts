import { expect } from "chai";
import { bufToStream } from "../lib/bufToStream";
import { StreamReader } from "../lib/StreamReader";

function sut(val: number | string) {
    if (typeof val === "number") {
        const buf = Buffer.alloc(val);
        for (let i = 0; i < val; i++) buf[i] = i + 1;
        return new StreamReader(bufToStream(buf));
    } else {
        return new StreamReader(bufToStream(Buffer.from(val, "hex")));
    }
}

const tests = [
    [".readBytes() all values", () => sut(4).readBytes(4), Buffer.from([1, 2, 3, 4])],
    [".readBytes() zero", () => sut(4).readBytes(0), Buffer.from([])],
    [".readBytes() RangeError", () => sut(4).readBytes(5), RangeError],
    [".readBytes() remaining bytes", () => sut(4).readBytes(), Buffer.from([1, 2, 3, 4])],
    [".readBytes() zero remaining", () => sut(0).readBytes(), Buffer.from([])],

    [".readUIntLE()", () => sut(4).readUIntLE(2), 513],
    [".readUIntBE()", () => sut(4).readUIntBE(2), 258],

    [".readUInt8()", () => sut(1).readUInt8(), 1],
    [".readUInt8() RangeError", () => sut(0).readUInt8(), RangeError],

    [".readUInt16LE()", () => sut(2).readUInt16LE(), 513],
    [".readUInt16LE() RangError", () => sut(1).readUInt16LE(), RangeError],
    [".readUInt16BE()", () => sut(2).readUInt16BE(), 258],
    [".readUInt16BE() RangError", () => sut(1).readUInt16BE(), RangeError],

    [".readUInt32LE()", () => sut(4).readUInt32LE(), 67305985],
    [".readUInt32LE() RangError", () => sut(1).readUInt32LE(), RangeError],
    [".readUInt32BE()", () => sut(4).readUInt32BE(), 16909060],
    [".readUInt32BE() RangError", () => sut(1).readUInt32BE(), RangeError],

    [".readBigUInt64LE()", () => sut(8).readBigUInt64LE(), BigInt("578437695752307201")],
    [".readBigUInt64LE() RangError", () => sut(1).readBigUInt64LE(), RangeError],
    [".readBigUInt64BE()", () => sut(8).readBigUInt64BE(), BigInt("72623859790382856")],
    [".readBigUInt64BE() RangError", () => sut(1).readBigUInt64BE(), RangeError],

    [".readVarInt() 1 byte", () => sut("01").readVarInt(), BigInt(1)],
    [".readVarInt() 2 byte number", () => sut("fd0001").readVarInt(), BigInt(256)],
    [".readVarInt() 4 byte number", () => sut("fe00000001").readVarInt(), BigInt(16777216)],
    [
        ".readVarInt() 8 byte number",
        () => sut("ff0000000000000001").readVarInt(),
        BigInt("72057594037927936"),
    ],

    [".readBigSize() 1 byte", () => sut("01").readBigSize(), BigInt(1)],
    [".readBigSize() 2 byte number", () => sut("fd0100").readBigSize(), BigInt(256)],
    [".readBigSize() 4 byte number", () => sut("fe01000000").readBigSize(), BigInt(16777216)],
    [
        ".readBigSize() 8 byte number",
        () => sut("ff0100000000000000").readBigSize(),
        BigInt("72057594037927936"),
    ],
] as any;

describe("StreamReader", () => {
    for (const [title, fn, expected] of tests) {
        if (expected === RangeError) {
            it(title, () => {
                expect(() => fn()).to.throw(expected);
            });
        } else {
            it(title, () => {
                expect(fn()).to.deep.equal(expected);
            });
        }
    }

    describe(".unshift()", () => {
        it("pushes read bytes back onto stream", () => {
            const buf = Buffer.from([0, 1, 2, 3]);
            const sr = StreamReader.fromBuffer(buf);
            const chunk = sr.readBytes(2);
            sr.unshift(chunk);
            expect(sr.readBytes(4)).to.deep.equal(buf);
        });
    });

    describe("#fromBuffer()", () => {
        it("constructs from buffer", () => {
            const buf = Buffer.from([0, 1, 2, 3]);
            const sr = StreamReader.fromBuffer(buf);
            const bytes = sr.readBytes(4);
            expect(bytes).to.deep.equal(buf);
        });
    });

    describe("#fromHex()", () => {
        it("constructs from hex", () => {
            const sr = StreamReader.fromHex("00010203");
            const bytes = sr.readBytes(4);
            expect(bytes).to.deep.equal(Buffer.from([0, 1, 2, 3]));
        });
    });
});
