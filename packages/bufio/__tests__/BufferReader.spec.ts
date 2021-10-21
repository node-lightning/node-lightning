import { expect } from "chai";
import { BufferReader } from "../lib/BufferReader";

describe("BufferReader", () => {
    type ReadTestFixture = { method: string; instance: BufferReader; expected?: number[] };
    const readTests: ReadTestFixture[] = [
        {
            method: "readUInt8",
            instance: new BufferReader(Buffer.from([1, 2, 3])),
            expected: [1, 2, 3],
        },
        {
            method: "readUInt16LE",
            instance: new BufferReader(Buffer.from([1, 0, 2, 0, 3, 0])),
            expected: [1, 2, 3],
        },
        {
            method: "readUInt16BE",
            instance: new BufferReader(Buffer.from([0, 1, 0, 2, 0, 3])),
        },
        {
            method: "readUInt32LE",
            instance: new BufferReader(Buffer.from([1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0])),
        },
        {
            method: "readUInt32BE",
            instance: new BufferReader(Buffer.from([0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3])),
        },
        {
            method: "readUInt64LE",
            instance: new BufferReader(
                Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0]), // prettier-ignore
            ),
        },
        {
            method: "readUInt64BE",
            instance: new BufferReader(
                Buffer.from([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3]), // prettier-ignore
            ),
        },
    ];

    for (const readTest of readTests) {
        describe(readTest.method, () => {
            it("should read at start", () => {
                const actual = readTest.instance[readTest.method]();
                expect(Number(actual)).to.equal(1);
            });
            it("should read in middle", () => {
                const actual = readTest.instance[readTest.method]();
                expect(Number(actual)).to.equal(2);
            });
            it("should read at last", () => {
                const actual = readTest.instance[readTest.method]();
                expect(Number(actual)).to.equal(3);
            });
            it("should throw when out of bounds", () => {
                expect(() => readTest.instance[readTest.method]()).to.throw("Index out of range");
            });
        });
    }

    describe("lastReadBytes", () => {
        it("should start at 0", () => {
            const sut = new BufferReader(Buffer.from([1]));
            expect(sut.lastReadBytes).to.equal(0);
        });
        it("should return for standard read", () => {
            const sut = new BufferReader(Buffer.from([1]));
            sut.readUInt8();
            expect(sut.lastReadBytes).to.equal(1);
        });
    });

    describe("readBytes", () => {
        let br: BufferReader;
        before(() => {
            br = new BufferReader(Buffer.from([0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3]));
        });
        it("should read at start", () => {
            expect(br.readBytes(2)).to.deep.equal(Buffer.from([0, 1]));
        });
        it("should read in middle", () => {
            expect(br.readBytes(4)).to.deep.equal(Buffer.from([0, 0, 0, 2]));
        });
        it("should throw when read is out of bounds", () => {
            expect(() => br.readBytes(9)).to.throw("Index out of range");
        });
        it("should read to end", () => {
            expect(br.readBytes(8)).to.deep.equal(Buffer.from([0, 0, 0, 0, 0, 0, 0, 3]));
        });
        it("should throw when at end if length specified", () => {
            expect(() => br.readBytes(1)).to.throw("Index out of range");
        });
        it("should read remaining bytes when at start", () => {
            br = new BufferReader(Buffer.from([0, 0, 0, 1]));
            expect(br.readBytes()).to.deep.equal(Buffer.from([0, 0, 0, 1]));
        });
        it("should read remaining bytes when in middle", () => {
            br = new BufferReader(Buffer.from([0, 0, 0, 1]));
            br.readBytes(1);
            expect(br.readBytes()).to.deep.equal(Buffer.from([0, 0, 1]));
        });
        it("should return empty buffer when at end but no length specified", () => {
            br = new BufferReader(Buffer.from([1]));
            br.readBytes(1);
            expect(br.readBytes()).to.deep.equal(Buffer.alloc(0));
        });
        it("should return empty buffer when at end but no length specified", () => {
            br = new BufferReader(Buffer.alloc(0));
            expect(br.readBytes()).to.deep.equal(Buffer.alloc(0));
            expect(() => br.readBytes(1)).to.throw("Index out of range");
        });
        it("should return empty buffer is read length is 0", () => {
            br = new BufferReader(Buffer.alloc(0));
            expect(br.readBytes(0)).to.deep.equal(Buffer.alloc(0));
        });
        it("should not share memory with the underlying buffer", () => {
            br = new BufferReader(Buffer.from([0, 1, 2, 3]));
            const result = br.readBytes();
            result.reverse();
            expect(br.buffer).to.deep.equal(Buffer.from([0, 1, 2, 3]));
        });
    });

    describe("readVarUint", () => {
        it("should return 1 byte numbers", () => {
            const result = new BufferReader(Buffer.from("01", "hex")).readVarUint();
            expect(result.toString()).to.equal("1");
        });
        it("should indicate 1 byte read", () => {
            const sut = new BufferReader(Buffer.from("01", "hex"));
            sut.readVarUint();
            expect(sut.lastReadBytes).to.equal(1);
        });
        it("should return 2 byte numbers", () => {
            const result = new BufferReader(Buffer.from("fd0100", "hex")).readVarUint();
            expect(result.toString()).to.equal("1");
        });
        it("should indicate 2 byte read", () => {
            const sut = new BufferReader(Buffer.from("fd0100", "hex"));
            sut.readVarUint();
            expect(sut.lastReadBytes).to.equal(2);
        });
        it("should return 4 byte numbers", () => {
            const result = new BufferReader(Buffer.from("fe01000000", "hex")).readVarUint();
            expect(result.toString()).to.equal("1");
        });
        it("should indicate 4 byte read", () => {
            const sut = new BufferReader(Buffer.from("fe01000000", "hex"));
            sut.readVarUint();
            expect(sut.lastReadBytes).to.equal(4);
        });
        it("should return 8 byte numbers", () => {
            const result = new BufferReader(Buffer.from("ff0100000000000000", "hex")).readVarUint();
            expect(result.toString()).to.equal("1");
        });
        it("should indicate 8 byte read", () => {
            const sut = new BufferReader(Buffer.from("ff0100000000000000", "hex"));
            sut.readVarUint();
            expect(sut.lastReadBytes).to.equal(8);
        });
    });

    describe("readBigSize", () => {
        const tests = [
            {
                name: "zero",
                value: "0",
                bytes: "00",
            },
            {
                name: "one byte high",
                value: "252",
                bytes: "fc",
            },
            {
                name: "two byte low",
                value: "253",
                bytes: "fd00fd",
            },
            {
                name: "two byte high",
                value: "65535",
                bytes: "fdffff",
            },
            {
                name: "four byte low",
                value: "65536",
                bytes: "fe00010000",
            },
            {
                name: "four byte high",
                value: "4294967295",
                bytes: "feffffffff",
            },
            {
                name: "eight byte low",
                value: "4294967296",
                bytes: "ff0000000100000000",
            },
            {
                name: "eight byte high",
                value: "18446744073709551615",
                bytes: "ffffffffffffffffff",
            },
            {
                name: "two byte not canonical",
                value: 0,
                bytes: "fd00fc",
                exp_error: "decoded varint is not canonical",
            },
            {
                name: "four byte not canonical",
                value: 0,
                bytes: "fe0000ffff",
                exp_error: "decoded varint is not canonical",
            },
            {
                name: "eight byte not canonical",
                value: 0,
                bytes: "ff00000000ffffffff",
                exp_error: "decoded varint is not canonical",
            },
            {
                name: "two byte short read",
                value: 0,
                bytes: "fd00",
                exp_error: "Index out of range",
            },
            {
                name: "four byte short read",
                value: 0,
                bytes: "feffff",
                exp_error: "Index out of range",
            },
            {
                name: "eight byte short read",
                value: 0,
                bytes: "ffffffffff",
                exp_error: "Index out of range",
            },
            {
                name: "one byte no read",
                value: 0,
                bytes: "",
                exp_error: "Index out of range",
            },
            {
                name: "two byte no read",
                value: 0,
                bytes: "fd",
                exp_error: "Index out of range",
            },
            {
                name: "four byte no read",
                value: 0,
                bytes: "fe",
                exp_error: "Index out of range",
            },
            {
                name: "eight byte no read",
                value: 0,
                bytes: "ff",
                exp_error: "Index out of range",
            },
        ];
        for (const test of tests) {
            it(test.name, () => {
                const sut = new BufferReader(Buffer.from(test.bytes, "hex"));
                try {
                    const result = sut.readBigSize();
                    expect(result.toString()).to.equal(test.value);
                } catch (ex) {
                    if (test.exp_error) expect(ex.message).to.equal(test.exp_error);
                    else throw ex;
                }
            });
        }
    });

    describe(".readTUInt16()", () => {
        it("should read 0-byte", () => {
            const sut = new BufferReader(Buffer.alloc(0));
            const a = sut.readTUInt32();
            expect(a).to.equal(0);
        });

        it("should read 1-byte", () => {
            const sut = new BufferReader(Buffer.from([1]));
            const a = sut.readTUInt32();
            expect(a).to.equal(1);
        });

        it("should read 2-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 1]));
            const a = sut.readTUInt32();
            expect(a).to.equal(257);
        });
    });

    describe(".readTUInt32()", () => {
        it("should read 0-byte", () => {
            const sut = new BufferReader(Buffer.alloc(0));
            const a = sut.readTUInt32();
            expect(a).to.equal(0);
        });

        it("should read 1-byte", () => {
            const sut = new BufferReader(Buffer.from([1]));
            const a = sut.readTUInt32();
            expect(a).to.equal(1);
        });

        it("should read 2-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 1]));
            const a = sut.readTUInt32();
            expect(a).to.equal(257);
        });

        it("should read 3-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 0, 0]));
            const a = sut.readTUInt32();
            expect(a).to.equal(0x010000);
        });

        it("should read 4-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 0, 0, 0]));
            const a = sut.readTUInt32();
            expect(a).to.equal(0x01000000);
        });
    });

    describe(".readTUInt64()", () => {
        it("should read 0-byte", () => {
            const sut = new BufferReader(Buffer.alloc(0));
            const a = sut.readTUInt64();
            expect(a).to.equal(BigInt(0));
        });

        it("should read 1-byte", () => {
            const sut = new BufferReader(Buffer.from([1]));
            const a = sut.readTUInt64();
            expect(a).to.equal(BigInt(1));
        });

        it("should read 2-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 1]));
            const a = sut.readTUInt64();
            expect(a).to.equal(BigInt(257));
        });

        it("should read 3-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 0, 0]));
            const a = sut.readTUInt64();
            expect(a).to.equal(BigInt("0x010000"));
        });

        it("should read 4-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 0, 0, 0]));
            const a = sut.readTUInt64();
            expect(a).to.equal(BigInt("0x01000000"));
        });

        it("should read 5-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 0, 0, 0, 0]));
            const a = sut.readTUInt64();
            expect(a).to.equal(BigInt("0x0100000000"));
        });

        it("should read 6-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 0, 0, 0, 0, 0]));
            const a = sut.readTUInt64();
            expect(a).to.equal(BigInt("0x010000000000"));
        });

        it("should read 7-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 0, 0, 0, 0, 0, 0]));
            const a = sut.readTUInt64();
            expect(a).to.equal(BigInt("0x01000000000000"));
        });

        it("should read 8-byte", () => {
            const sut = new BufferReader(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]));
            const a = sut.readTUInt64();
            expect(a).to.equal(BigInt("0x0100000000000000"));
        });

        it("should read max", () => {
            const sut = new BufferReader(Buffer.from([255, 255, 255, 255, 255, 255, 255, 255]));
            const a = sut.readTUInt64();
            expect(a).to.equal(BigInt("0xffffffffffffffff"));
        });
    });

    describe("peakBytes", () => {
        it("should return empty buffer when 0", () => {
            const sut = new BufferReader(Buffer.from([1]));
            const result = sut.peakBytes(0);
            expect(result).to.deep.equal(Buffer.alloc(0));
        });
        it("should return buffer of length", () => {
            const sut = new BufferReader(Buffer.from([1]));
            const result = sut.peakBytes(1);
            expect(result).to.deep.equal(Buffer.from([1]));
        });
        it("should return buffer of length", () => {
            const sut = new BufferReader(Buffer.from([1]));
            expect(() => sut.peakBytes(2)).to.throw("Index out of range");
        });
        it("should return all bytes remaining when omitted", () => {
            const sut = new BufferReader(Buffer.from([1]));
            const result = sut.peakBytes();
            expect(result).to.deep.equal(Buffer.from([1]));
        });
        it("should throw when eof", () => {
            const sut = new BufferReader(Buffer.from([1]));
            sut.readBytes();
            expect(() => sut.peakBytes()).to.throw("Index out of range");
        });
        it("should not share memory with the underlying buffer", () => {
            const sut = new BufferReader(Buffer.from([0, 1, 2, 3]));
            const result = sut.peakBytes();
            result.reverse();
            expect(sut.buffer).to.deep.equal(Buffer.from([0, 1, 2, 3]));
        });
    });

    describe("position", () => {
        let br: BufferReader;
        before(() => {
            br = new BufferReader(
                Buffer.from([1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0, 5, 6, 0, 0, 0, 7]),
            );
        });
        it("should start at 0", () => {
            expect(br.position).to.equal(0);
        });
        it("should advance by 1 with readUInt8", () => {
            br.readUInt8();
            expect(br.position).to.equal(1);
        });
        it("should advance by 2 with readUInt16LE", () => {
            br.readUInt16LE();
            expect(br.position).to.equal(3);
        });
        it("should advance by 2 with readUInt16BE", () => {
            br.readUInt16BE();
            expect(br.position).to.equal(5);
        });
        it("should advance by 4 with readUInt32LE", () => {
            br.readUInt32LE();
            expect(br.position).to.equal(9);
        });
        it("should advance by 4 with readUInt32BE", () => {
            br.readUInt32BE();
            expect(br.position).to.equal(13);
        });
        it("should advance by read amount with readBytes", () => {
            br.readBytes(1);
            expect(br.position).to.equal(14);
        });
        it("should advance by rest with readBytes without len", () => {
            br.readBytes();
            expect(br.position).to.equal(18);
        });
        it("should set to specified value", () => {
            br.position = 0;
            expect(br.position).to.equal(0);
        });
    });

    describe("eof", () => {
        let br: BufferReader;
        before(() => {
            br = new BufferReader(Buffer.from([1, 2]));
        });
        it("should be false at start", () => {
            expect(br.eof).to.be.false;
        });
        it("should be false in middle", () => {
            br.readBytes(1);
            expect(br.eof).to.be.false;
        });
        it("should be true when all bytes read", () => {
            br.readBytes(1);
            expect(br.eof).to.be.true;
        });
    });

    describe("bigSizeBytes", () => {
        it("should return 1 for 0x00", () => {
            expect(BufferReader.bigSizeBytes(BigInt(0))).to.equal(1);
        });

        it("should return 1 for 0xfc", () => {
            expect(BufferReader.bigSizeBytes(BigInt("0xfc"))).to.equal(1);
        });

        it("should return 3 for 0xfd", () => {
            expect(BufferReader.bigSizeBytes(BigInt("0xfd"))).to.equal(3);
        });

        it("should return 3 for 0x0ffff", () => {
            expect(BufferReader.bigSizeBytes(BigInt("0x0ffff"))).to.equal(3);
        });

        it("should return 5 for 0x10000", () => {
            expect(BufferReader.bigSizeBytes(BigInt("0x10000"))).to.equal(5);
        });

        it("should return 5 for 0x0ffffffff", () => {
            expect(BufferReader.bigSizeBytes(BigInt("0x0ffffffff"))).to.equal(5);
        });

        it("should return 9 for 0x100000000", () => {
            expect(BufferReader.bigSizeBytes(BigInt("0x100000000"))).to.equal(9);
        });

        it("should return 9 for 0xffffffffffffffff", () => {
            expect(BufferReader.bigSizeBytes(BigInt("0xffffffffffffffff"))).to.equal(9);
        });
    });
});
