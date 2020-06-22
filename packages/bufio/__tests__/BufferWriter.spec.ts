// tslint:disable: no-unused-expression
/* eslint-disable no-undef */

import { expect } from "chai";
import { BufferWriter } from "../lib/BufferWriter";

describe("BufferWriter", () => {
    describe("writeBigSize", () => {
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
        ];
        for (const test of tests) {
            it(test.name, () => {
                const expected = Buffer.from(test.bytes, "hex");
                const sut = new BufferWriter();
                sut.writeBigSize(BigInt(test.value));
                const buffer = sut.toBuffer();
                expect(buffer).to.deep.equal(expected);
            });
        }
    });

    describe("writeVarInt", () => {
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
                bytes: "fdfd00",
            },
            {
                name: "two byte high",
                value: "65535",
                bytes: "fdffff",
            },
            {
                name: "four byte low",
                value: "65536",
                bytes: "fe00000100",
            },
            {
                name: "four byte high",
                value: "4294967295",
                bytes: "feffffffff",
            },
            {
                name: "eight byte low",
                value: "4294967296",
                bytes: "ff0000000001000000",
            },
            {
                name: "eight byte high",
                value: "18446744073709551615",
                bytes: "ffffffffffffffffff",
            },
        ];
        for (const test of tests) {
            it(test.name, () => {
                const expected = Buffer.from(test.bytes, "hex");
                const sut = new BufferWriter();
                sut.writeVarInt(BigInt(test.value));
                const buffer = sut.toBuffer();
                expect(buffer).to.deep.equal(expected);
            });
        }
    });

    const writeTests = [
        {
            method: "writeUInt8",
            instance: new BufferWriter(),
            assertions: [Buffer.from([1]), Buffer.from([1, 2]), Buffer.from([1, 2, 3])],
        },
        {
            method: "writeUInt16LE",
            instance: new BufferWriter(),
            assertions: [
                Buffer.from([1, 0]),
                Buffer.from([1, 0, 2, 0]),
                Buffer.from([1, 0, 2, 0, 3, 0]),
            ],
        },
        {
            method: "writeUInt16BE",
            instance: new BufferWriter(),
            assertions: [
                Buffer.from([0, 1]),
                Buffer.from([0, 1, 0, 2]),
                Buffer.from([0, 1, 0, 2, 0, 3]),
            ],
        },
        {
            method: "writeUInt32LE",
            instance: new BufferWriter(),
            assertions: [
                Buffer.from([1, 0, 0, 0]),
                Buffer.from([1, 0, 0, 0, 2, 0, 0, 0]),
                Buffer.from([1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0]),
            ],
        },
        {
            method: "writeUInt32BE",
            instance: new BufferWriter(),
            assertions: [
                Buffer.from([0, 0, 0, 1]),
                Buffer.from([0, 0, 0, 1, 0, 0, 0, 2]),
                Buffer.from([0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3]),
            ],
        },
        {
            method: "writeUInt64LE",
            instance: new BufferWriter(),
            assertions: [
                Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]),
                Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0]),
                Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0]), // prettier-ignore
            ],
        },
        {
            method: "writeUInt64BE",
            instance: new BufferWriter(),
            assertions: [
                Buffer.from([0, 0, 0, 0, 0, 0, 0, 1]),
                Buffer.from([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2]),
                Buffer.from([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3]), // prettier-ignore
            ],
        },
    ];

    for (const writeTest of writeTests) {
        describe(writeTest.method, () => {
            it("should write at start", () => {
                writeTest.instance[writeTest.method](1);
                expect(writeTest.instance.toBuffer()).to.deep.equal(writeTest.assertions[0]);
            });
            it("should write in middle", () => {
                writeTest.instance[writeTest.method](2);
                expect(writeTest.instance.toBuffer()).to.deep.equal(writeTest.assertions[1]);
            });
            it("should write at end", () => {
                writeTest.instance[writeTest.method](3);
                expect(writeTest.instance.toBuffer()).to.deep.equal(writeTest.assertions[2]);
            });
            it("should throw when out of bounds", () => {
                const instance = new BufferWriter(Buffer.alloc(1));
                expect(() => {
                    instance[writeTest.method](0);
                    instance[writeTest.method](0);
                }).to.throw();
            });

            if (writeTest.method.startsWith("writeUInt64")) {
                it("should throw when exceeds lower bound", () => {
                    expect(() => writeTest.instance[writeTest.method](BigInt(-1))).to.throw(
                        'The value of "value" is out of range. It must be >= 0 and <= 18446744073709551615. Received -1',
                    );
                });

                it("should throw when exceeds upper bound", () => {
                    expect(() =>
                        writeTest.instance[writeTest.method](BigInt("18446744073709551616")),
                    ).to.throw(
                        'The value of "value" is out of range. It must be >= 0 and <= 18446744073709551615. Received 18446744073709551616',
                    );
                });
            }
        });
    }

    describe("writeBytes", () => {
        let br: BufferWriter;
        before(() => {
            br = new BufferWriter(Buffer.alloc(8));
        });
        it("should ignore writing a null", () => {
            br.writeBytes(null);
            expect(br.toBuffer()).to.deep.equal(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]));
        });
        it("should ignore writing an empty buffer", () => {
            br.writeBytes(Buffer.alloc(0));
            expect(br.toBuffer()).to.deep.equal(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]));
        });
        it("should write at start", () => {
            br.writeBytes(Buffer.from([1]));
            expect(br.toBuffer()).to.deep.equal(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]));
        });
        it("should write in middle", () => {
            br.writeBytes(Buffer.from([2, 2]));
            expect(br.toBuffer()).to.deep.equal(Buffer.from([1, 2, 2, 0, 0, 0, 0, 0]));
        });
        it("should throw if write buffer exceeds cursor", () => {
            expect(() => br.writeBytes(Buffer.from([6, 6, 6, 6, 6, 6]))).to.throw();
        });
        it("should write to end", () => {
            br.writeBytes(Buffer.from([5, 5, 5, 5, 5]));
            expect(br.toBuffer()).to.deep.equal(Buffer.from([1, 2, 2, 5, 5, 5, 5, 5]));
        });
        it("should not care about writing zero byte buffer", () => {
            br.writeBytes(Buffer.alloc(0));
            expect(br.toBuffer()).to.deep.equal(Buffer.from([1, 2, 2, 5, 5, 5, 5, 5]));
        });
        it("should expand as needed", () => {
            br = new BufferWriter();
            br.writeBytes(Buffer.alloc(5, 0xff));
            expect(br.toBuffer()).to.deep.equal(Buffer.from([255, 255, 255, 255, 255]));
        });
    });

    describe(".writeTUInt16()", () => {
        it("should write 0-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt16(0);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("");
            expect(buffer.length).to.equal(0);
        });

        it("should write 1-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt16(255);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ff");
            expect(buffer.length).to.equal(1);
        });

        it("should write 1-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt16(0x0f);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0f");
            expect(buffer.length).to.equal(1);
        });

        it("should write 2-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt16(256);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0100");
            expect(buffer.length).to.equal(2);
        });
    });

    describe(".writeTUInt32()", () => {
        it("should write 0-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt32(0);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("");
            expect(buffer.length).to.equal(0);
        });

        it("should write 1-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt32(255);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ff");
            expect(buffer.length).to.equal(1);
        });

        it("should write 1-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt32(0x0f);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0f");
            expect(buffer.length).to.equal(1);
        });

        it("should write 2-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt32(256);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0100");
            expect(buffer.length).to.equal(2);
        });

        it("should write 2-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt32(0x0fff);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0fff");
            expect(buffer.length).to.equal(2);
        });

        it("should write 3-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt32(0xffffff);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ffffff");
            expect(buffer.length).to.equal(3);
        });

        it("should write 3-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt32(0x0fffff);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0fffff");
            expect(buffer.length).to.equal(3);
        });

        it("should write 4-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt32(0xffffffff);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ffffffff");
            expect(buffer.length).to.equal(4);
        });

        it("should write 4-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt32(0x0fffffff);
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0fffffff");
            expect(buffer.length).to.equal(4);
        });
    });

    describe(".writeTUInt64()", () => {
        it("should write 0-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0x00"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("");
            expect(buffer.length).to.equal(0);
        });

        it("should write 1-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0xff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ff");
            expect(buffer.length).to.equal(1);
        });

        it("should write 1-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0x0f"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0f");
            expect(buffer.length).to.equal(1);
        });

        it("should write 2-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0xffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ffff");
            expect(buffer.length).to.equal(2);
        });

        it("should write 2-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0x0fff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0fff");
            expect(buffer.length).to.equal(2);
        });

        it("should write 3-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0xffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ffffff");
            expect(buffer.length).to.equal(3);
        });

        it("should write 3-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0x0fffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0fffff");
            expect(buffer.length).to.equal(3);
        });

        it("should write 4-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0xffffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ffffffff");
            expect(buffer.length).to.equal(4);
        });

        it("should write 4-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0x0fffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0fffffff");
            expect(buffer.length).to.equal(4);
        });

        it("should write 5-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0xffffffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ffffffffff");
            expect(buffer.length).to.equal(5);
        });

        it("should write 5-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0x0fffffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0fffffffff");
            expect(buffer.length).to.equal(5);
        });

        it("should write 6-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0xffffffffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ffffffffffff");
            expect(buffer.length).to.equal(6);
        });

        it("should write 6-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0x0fffffffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0fffffffffff");
            expect(buffer.length).to.equal(6);
        });

        it("should write 7-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0xffffffffffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ffffffffffffff");
            expect(buffer.length).to.equal(7);
        });

        it("should write 7-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0x0fffffffffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0fffffffffffff");
            expect(buffer.length).to.equal(7);
        });

        it("should write 8-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0xffffffffffffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("ffffffffffffffff");
            expect(buffer.length).to.equal(8);
        });

        it("should write 8-byte value", () => {
            const sut = new BufferWriter();
            sut.writeTUInt64(BigInt("0x0fffffffffffffff"));
            const buffer = sut.toBuffer();
            expect(buffer.toString("hex")).to.equal("0fffffffffffffff");
            expect(buffer.length).to.equal(8);
        });
    });
});
