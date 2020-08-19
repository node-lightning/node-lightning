# `@node-lightning/checksum`

Calculates a CRC32C checksum based on RFC3720.

## Usage

```
const { crc32c } = require('@node-lightning/checksum');
const checksum = crc32c(Buffer.from("hello")); // 2591144780
```
