const { expect } = require("chai");
const BN = require("bn.js");
const { BufferCursor } = require("../lib");

const readTests = [
  {
    method: "readUInt8",
    instance: new BufferCursor(Buffer.from([1, 2, 3])),
    expected: [1, 2, 3],
  },
  {
    method: "readUInt16LE",
    instance: new BufferCursor(Buffer.from([1, 0, 2, 0, 3, 0])),
    expected: [1, 2, 3],
  },
  {
    method: "readUInt16BE",
    instance: new BufferCursor(Buffer.from([0, 1, 0, 2, 0, 3])),
  },
  {
    method: "readUInt32LE",
    instance: new BufferCursor(Buffer.from([1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0])),
  },
  {
    method: "readUInt32BE",
    instance: new BufferCursor(Buffer.from([0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3])),
  },
  {
    method: "readUInt64LE",
    instance: new BufferCursor(
      Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0]),
    ),
  },
  {
    method: "readUInt64BE",
    instance: new BufferCursor(
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3]),
    ),
  },
];

for (let readTest of readTests) {
  describe(readTest.method, () => {
    it("should read at start", () => {
      let actual = readTest.instance[readTest.method]();
      actual = actual instanceof BN ? actual.toNumber() : actual;
      expect(actual).to.equal(1);
    });
    it("should read in middle", () => {
      let actual = readTest.instance[readTest.method]();
      actual = actual instanceof BN ? actual.toNumber() : actual;
      expect(actual).to.equal(2);
    });
    it("should read at last", () => {
      let actual = readTest.instance[readTest.method]();
      actual = actual instanceof BN ? actual.toNumber() : actual;
      expect(actual).to.equal(3);
    });
    it("should throw when out of bounds", () => {
      expect(() => readTest.instance[readTest.method]()).to.throw("Index out of range");
    });
  });
}

describe("lastReadBytes", () => {
  it("should start at 0", () => {
    let sut = new BufferCursor(Buffer.from([1]));
    expect(sut.lastReadBytes).to.equal(0);
  });
  it("should return for standard read", () => {
    let sut = new BufferCursor(Buffer.from([1]));
    sut.readUInt8();
    expect(sut.lastReadBytes).to.equal(1);
  });
});

describe("readBytes", () => {
  let buffer;
  before(() => {
    buffer = new BufferCursor(Buffer.from([0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3]));
  });
  it("should read at start", () => {
    expect(buffer.readBytes(2)).to.deep.equal(Buffer.from([0, 1]));
  });
  it("should read in middle", () => {
    expect(buffer.readBytes(4)).to.deep.equal(Buffer.from([0, 0, 0, 2]));
  });
  it("should throw when read is out of bounds", () => {
    expect(() => buffer.readBytes(9)).to.throw("Index out of range");
  });
  it("should read to end", () => {
    expect(buffer.readBytes(8)).to.deep.equal(Buffer.from([0, 0, 0, 0, 0, 0, 0, 3]));
  });
  it("should throw when at end", () => {
    expect(() => buffer.readBytes(1)).to.throw("Index out of range");
  });
  it("should read remaining bytes when at start", () => {
    buffer = new BufferCursor(Buffer.from([0, 0, 0, 1]));
    expect(buffer.readBytes()).to.deep.equal(Buffer.from([0, 0, 0, 1]));
  });
  it("should read remaining bytes when in middle", () => {
    buffer = new BufferCursor(Buffer.from([0, 0, 0, 1]));
    buffer.readBytes(1);
    expect(buffer.readBytes()).to.deep.equal(Buffer.from([0, 0, 1]));
  });
  it("should throw error when at end of buffer", () => {
    buffer = new BufferCursor(Buffer.from([1]));
    buffer.readBytes(1);
    expect(() => buffer.readBytes()).to.throw("Index out of range");
  });
  it("should return empty buffer is read length is 0", () => {
    buffer = new BufferCursor(Buffer.alloc(0));
    expect(buffer.readBytes(0)).to.deep.equal(Buffer.alloc(0));
  });
  it("should not share memory with the underlying buffer", () => {
    buffer = new BufferCursor(Buffer.from([0, 1, 2, 3]));
    let result = buffer.readBytes();
    result.reverse();
    expect(buffer.buffer).to.deep.equal(Buffer.from([0, 1, 2, 3]));
  });
});

describe("readVarUint", () => {
  it("should return 1 byte numbers", () => {
    let result = new BufferCursor(Buffer.from("01", "hex")).readVarUint();
    expect(result.toString("hex")).to.equal("1");
  });
  it("should indicate 1 byte read", () => {
    let sut = new BufferCursor(Buffer.from("01", "hex"));
    sut.readVarUint();
    expect(sut.lastReadBytes).to.equal(1);
  });
  it("should return 2 byte numbers", () => {
    let result = new BufferCursor(Buffer.from("fd0100", "hex")).readVarUint();
    expect(result.toString("hex")).to.equal("1");
  });
  it("should indicate 2 byte read", () => {
    let sut = new BufferCursor(Buffer.from("fd0100", "hex"));
    sut.readVarUint();
    expect(sut.lastReadBytes).to.equal(2);
  });
  it("should return 4 byte numbers", () => {
    let result = new BufferCursor(Buffer.from("fe01000000", "hex")).readVarUint();
    expect(result.toString("hex")).to.equal("1");
  });
  it("should indicate 4 byte read", () => {
    let sut = new BufferCursor(Buffer.from("fe01000000", "hex"));
    sut.readVarUint();
    expect(sut.lastReadBytes).to.equal(4);
  });
  it("should return 8 byte numbers", () => {
    let result = new BufferCursor(Buffer.from("ff0100000000000000", "hex")).readVarUint();
    expect(result.toString("hex")).to.equal("1");
  });
  it("should indicate 8 byte read", () => {
    let sut = new BufferCursor(Buffer.from("ff0100000000000000", "hex"));
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
      const sut = new BufferCursor(Buffer.from(test.bytes, "hex"));
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

describe("peakBytes", () => {
  it("should return empty buffer when 0", () => {
    let sut = new BufferCursor(Buffer.from([1]));
    let result = sut.peakBytes(0);
    expect(result).to.deep.equal(Buffer.alloc(0));
  });
  it("should return buffer of length", () => {
    let sut = new BufferCursor(Buffer.from([1]));
    let result = sut.peakBytes(1);
    expect(result).to.deep.equal(Buffer.from([1]));
  });
  it("should return buffer of length", () => {
    let sut = new BufferCursor(Buffer.from([1]));
    expect(() => sut.peakBytes(2)).to.throw("Index out of range");
  });
  it("should return all bytes remaining when omitted", () => {
    let sut = new BufferCursor(Buffer.from([1]));
    let result = sut.peakBytes();
    expect(result).to.deep.equal(Buffer.from([1]));
  });
  it("should throw when eof", () => {
    let sut = new BufferCursor(Buffer.from([1]));
    sut.readBytes();
    expect(() => sut.peakBytes()).to.throw("Index out of range");
  });
  it("should not share memory with the underlying buffer", () => {
    let sut = new BufferCursor(Buffer.from([0, 1, 2, 3]));
    let result = sut.peakBytes();
    result.reverse();
    expect(sut.buffer).to.deep.equal(Buffer.from([0, 1, 2, 3]));
  });
});

const writeTests = [
  {
    method: "writeUInt8",
    instance: new BufferCursor(Buffer.alloc(3)),
    assertions: [Buffer.from([1, 0, 0]), Buffer.from([1, 2, 0]), Buffer.from([1, 2, 3])],
  },
  {
    method: "writeUInt16LE",
    instance: new BufferCursor(Buffer.alloc(6)),
    assertions: [
      Buffer.from([1, 0, 0, 0, 0, 0]),
      Buffer.from([1, 0, 2, 0, 0, 0]),
      Buffer.from([1, 0, 2, 0, 3, 0]),
    ],
  },
  {
    method: "writeUInt16BE",
    instance: new BufferCursor(Buffer.alloc(6)),
    assertions: [
      Buffer.from([0, 1, 0, 0, 0, 0]),
      Buffer.from([0, 1, 0, 2, 0, 0]),
      Buffer.from([0, 1, 0, 2, 0, 3]),
    ],
  },
  {
    method: "writeUInt32LE",
    instance: new BufferCursor(Buffer.alloc(12)),
    assertions: [
      Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      Buffer.from([1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0]),
      Buffer.from([1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0]),
    ],
  },
  {
    method: "writeUInt32BE",
    instance: new BufferCursor(Buffer.alloc(12)),
    assertions: [
      Buffer.from([0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]),
      Buffer.from([0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0]),
      Buffer.from([0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3]),
    ],
  },
  {
    method: "writeUInt64LE",
    instance: new BufferCursor(Buffer.alloc(24)),
    assertions: [
      Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0]),
    ],
  },
  {
    method: "writeUInt64BE",
    instance: new BufferCursor(Buffer.alloc(24)),
    assertions: [
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0]),
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3]),
    ],
  },
];

for (let writeTest of writeTests) {
  describe(writeTest.method, () => {
    it("should write at start", () => {
      writeTest.instance[writeTest.method](1);
      expect(writeTest.instance.buffer).to.deep.equal(writeTest.assertions[0]);
    });
    it("should write in middle", () => {
      writeTest.instance[writeTest.method](2);
      expect(writeTest.instance.buffer).to.deep.equal(writeTest.assertions[1]);
    });
    it("should write at end", () => {
      writeTest.instance[writeTest.method](3);
      expect(writeTest.instance.buffer).to.deep.equal(writeTest.assertions[2]);
    });
    it("should throw when out of bounds", () => {
      expect(() => writeTest.instance[writeTest.method]()).to.throw("Index out of range");
    });
  });
}

describe("writeBytes", () => {
  let buffer;
  before(() => {
    buffer = new BufferCursor(Buffer.alloc(8));
  });
  it("should ignore writing a null", () => {
    buffer.writeBytes(null);
    expect(buffer.buffer).to.deep.equal(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]));
  });
  it("should ignore writing an empty buffer", () => {
    buffer.writeBytes(Buffer.alloc(0));
    expect(buffer.buffer).to.deep.equal(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]));
  });
  it("should write at start", () => {
    buffer.writeBytes(Buffer.from([1]));
    expect(buffer.buffer).to.deep.equal(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]));
  });
  it("should write in middle", () => {
    buffer.writeBytes(Buffer.from([2, 2]));
    expect(buffer.buffer).to.deep.equal(Buffer.from([1, 2, 2, 0, 0, 0, 0, 0]));
  });
  it("should throw if write buffer exceeds cursor", () => {
    expect(() => buffer.writeBytes(Buffer.from([6, 6, 6, 6, 6, 6]))).to.throw("Index out of range");
  });
  it("should write to end", () => {
    buffer.writeBytes(Buffer.from([5, 5, 5, 5, 5]));
    expect(buffer.buffer).to.deep.equal(Buffer.from([1, 2, 2, 5, 5, 5, 5, 5]));
  });
  it("should not care about writing zero byte buffer", () => {
    buffer.writeBytes(Buffer.alloc(0));
    expect(buffer.buffer).to.deep.equal(Buffer.from([1, 2, 2, 5, 5, 5, 5, 5]));
  });
});

describe("position", () => {
  let readbuf;
  let writebuf;
  before(() => {
    readbuf = new BufferCursor(Buffer.from([1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0, 5, 6, 0, 0, 0, 7]));
    writebuf = new BufferCursor(Buffer.alloc(18));
  });
  it("should start at 0", () => {
    expect(readbuf.position).to.equal(0);
  });
  it("should advance by 1 with readUInt8", () => {
    readbuf.readUInt8();
    expect(readbuf.position).to.equal(1);
  });
  it("should advance by 2 with readUInt16LE", () => {
    readbuf.readUInt16LE();
    expect(readbuf.position).to.equal(3);
  });
  it("should advance by 2 with readUInt16BE", () => {
    readbuf.readUInt16BE();
    expect(readbuf.position).to.equal(5);
  });
  it("should advance by 4 with readUInt32LE", () => {
    readbuf.readUInt32LE();
    expect(readbuf.position).to.equal(9);
  });
  it("should advance by 4 with readUInt32BE", () => {
    readbuf.readUInt32BE();
    expect(readbuf.position).to.equal(13);
  });
  it("should advance by read amount with readBytes", () => {
    readbuf.readBytes(1);
    expect(readbuf.position).to.equal(14);
  });
  it("should advance by rest with readBytes without len", () => {
    readbuf.readBytes();
    expect(readbuf.position).to.equal(18);
  });
  it("should advance by 1 with writeUInt8", () => {
    writebuf.writeUInt8(1);
    expect(writebuf.position).to.equal(1);
  });
  it("should advance by 2 with writeUInt16LE", () => {
    writebuf.writeUInt16LE(1);
    expect(writebuf.position).to.equal(3);
  });
  it("should advance by 2 with writeUInt16BE", () => {
    writebuf.writeUInt16BE(1);
    expect(writebuf.position).to.equal(5);
  });
  it("should advance by 4 with writeUInt32LE", () => {
    writebuf.writeUInt32LE(1);
    expect(writebuf.position).to.equal(9);
  });
  it("should advance by 4 with writeUInt32BE", () => {
    writebuf.writeUInt32BE(1);
    expect(writebuf.position).to.equal(13);
  });
  it("should advance by buffer length with writeBytes", () => {
    writebuf.writeBytes(Buffer.alloc(5));
    expect(writebuf.position).to.equal(18);
  });
  it("should set to specified value", () => {
    readbuf.position = 0;
    expect(readbuf.position).to.equal(0);
  });
});

describe("eof", () => {
  let buffer;
  before(() => {
    buffer = new BufferCursor(Buffer.from([1, 2]));
  });
  it("should be false at start", () => {
    expect(buffer.eof).to.be.false;
  });
  it("should be false in middle", () => {
    buffer.readBytes(1);
    expect(buffer.eof).to.be.false;
  });
  it("should be true when all bytes read", () => {
    buffer.readBytes(1);
    expect(buffer.eof).to.be.true;
  });
});
