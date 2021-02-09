export class Stack {
    /**
     * Decodes a number from the stack format (signed magnitude
     * representation).
     * @param buf
     */
    public static decodeNum(buf: Buffer): bigint {
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

    /**
     * Encodes a number into a stack compatible byte-array. The number
     * is encoded using little-endian signed-magnitude representation.
     * @param num
     */
    public static encodeNum(input: number | bigint): Buffer {
        const num = BigInt(input);

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
}
