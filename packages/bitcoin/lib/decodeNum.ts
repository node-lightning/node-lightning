/**
 * Decodes the number into from the script format, signed magnitude
 * representation.
 * @param buf
 */
export function decodeNum(buf: Buffer): bigint {
    let result = 0n;
    if (buf.length === 0) {
        return result;
    }

    // convert little-endian number to big-endian which swaps around the bytes
    // that occurred during encoding making the negative flag be in the first
    // byte
    const be = Buffer.from(buf).reverse();

    // check if the number is negative, which occurs when the 0x80 bit is set
    // on the first number
    let neg = false;
    if (be[0] & 0x80) {
        neg = true;
        be[0] = be[0] & 0x7f; // remove the 0x80 bit
    }

    // set result to MSB
    result = BigInt(be[0]);

    // read each byte off the buffer
    for (let i = 1; i < be.length; i++) {
        result <<= 8n; // shift right 1-byte
        result += BigInt(be[i]);
    }

    if (neg) {
        return -result;
    } else {
        return result;
    }
}
