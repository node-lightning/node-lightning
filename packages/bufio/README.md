# Utilities for Buffer IO

[![CircleCI](https://circleci.com/gh/altangent/node-lightning/tree/master.svg?style=shield)](https://circleci.com/gh/altangent/node-lightning/tree/master)
[![codecov](https://codecov.io/gh/altangent/node-lightning/branch/master/graph/badge.svg)](https://codecov.io/gh/altangent/node-lightning)

Usage:

```bash
npm install @node-lightning/bufio
```

```javascript
const { BufferReader, BufferWriter } = require("@node-lightning/bufio");

// write arbitrary length data
const writer = new BufferWriter();
writer.writeUInt8(1);
writer.writeUInt16BE(2);
writer.writeUInt32BE(3);
writer.writeBytes(Buffer.from([4]));
let buffer = writer.toBuffer();

// read values
const reader = new BufferReader(buffer);
console.log(buffer.readUInt8());
console.log(buffer.readUInt16BE());
console.log(buffer.readUInt32BE());
console.log(buffer.readBytes());
```

## BufferReader

This class wraps an existing Buffer and allows reading data from the Buffer. This class includes

-   `position: number` - the current buffer cursor position
-   `eof: bool` - whether the current position is at the end of the buffer
-   `buffer: Buffer` - the underlying buffer
-   `lastReadBytes` - number of bytes last read from the buffer

-   `readUInt8(): number` - reads 1 byte
-   `readUInt16LE(): number` - reads 2 bytes as 16-bit little-endian unsigned integer
-   `readUInt16BE(): number` - reads 2 bytes as 16-bit big-endian unsigned integer
-   `readUInt32LE(): number` - reads 4 bytes as 32-bit little-endian unsigned integer
-   `readUInt32BE(): number` - reads 4 bytes as 32-bit big-endian unsigned integer
-   `readUInt64LE(): bigint` - reads 8 bytes as 64-bit little-endian unsigned integer
-   `readUInt64BE(): bigint` - reads 8 bytes as 64-bit big-endian unsigned integer
-   `readVarUint(): bigint` - reads a variable length integer as defined in the Bitcoin protocol [docs](https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer)
-   `readBigSize(): bigint` - reads a variable length integer as defined in the Lightning Network
-   `readBytes([len]): Buffer` - reads the optionally specified number of bytes. If no length is supplied, it reads to the end of the buffer.

## BufferWriter

This class can accept an existing Buffer and write to. When used in this mode
the Buffer length is fixed and writes that overflow the Buffer will throw an
execption.

This class can intenrally manage a Buffer and will automatically expand to fit
the data footprint required. At the end of writing, `.toBuffer` must be called
to obtain the underlying Buffer.

-   `writeUInt8(number): undefined` - writes 1 byte
-   `writeUInt16LE(number): undefined` - writes a number as a 16-bit little-endian unsigned integer
-   `writeUInt16BE(number): undefined` - writes a number as a 16-bit big-endian unsigned integer
-   `writeUInt32LE(number): undefined` - writes a number as a 32-bit little-endian unsigned integer
-   `writeUInt32BE(number): undefined` - writes a number as a 32-bit big-endian unsigned integer
-   `writeUInt64LE(number): undefined` - writes a number as a 64-bit little-endian unsigned integer
-   `writeUInt64BE(number): undefined` - writes a number as a 64-bit big-endian unsigned integer
-   `writeBytes(buffer): undefined` - writes the supplied buffer to the cursor buffer
