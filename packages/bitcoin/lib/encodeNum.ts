/**
 * Encodes the number into the script format, signed magnitude representation.
 * @param num
 */
export function encodeNum(input: number | bigint): Buffer {
    const num = BigInt(input);
    if (num === 0n) {
        return Buffer.alloc(0);
    }

    const bytes = [];
    const neg = num < 0;
    let abs = num > 0 ? num : -num;

    // push each byte starting with the smallest
    while (abs > 0) {
        bytes.push(Number(abs & BigInt(0xff))); // push on smallest byte
        abs >>= 8n; // shift off smallest byte
    }

    // check if the last byte has the 0x80 bit set if so, then we either push
    // a 0 or 0x80 if it is postive or negative
    if (bytes[bytes.length - 1] & 0x80) {
        if (neg) {
            bytes.push(0x80);
        } else {
            bytes.push(0x00);
        }
    }

    // if the number is negative we set the 0x80 bit for the number to indicate
    // it is negative
    else {
        if (neg) {
            bytes[bytes.length - 1] |= 0x80;
        }
    }

    // return a buffer of the number
    return Buffer.from(bytes);
}
