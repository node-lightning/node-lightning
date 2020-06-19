/**
 * Encodes a number into a VarInt Buffer which is an unsigned integer from
 * 0 to 2^64-1 occupying 1 to 9 bytes. The first byte indicates the variable
 * length and numbers read in little-endian.
 *  < 0xfd   8-bit number
 *    0xfd:  16-bit LE number (3 bytes consumed)
 *    0xfe:  32-bit LE number (5 bytes consumed)
 *    0xff:  64-bit LE number (9 bytes consumed)
 * @param val
 */
export function encodeVarInt(i: bigint | number): Buffer {
    // 8-bit, 1-byte number
    if (i < BigInt("0xfd")) {
        return Buffer.from([Number(i)]);
    }
    // 16-bit, 2-byte number
    else if (i < BigInt("0x10000")) {
        const buf = Buffer.alloc(3);
        buf[0] = 0xfd;
        buf.writeUInt16LE(Number(i), 1);
        return buf;
    }
    // 32-bit, 4-byte number
    else if (i < BigInt("0x100000000")) {
        const buf = Buffer.alloc(5);
        buf[0] = 0xfe;
        buf.writeUInt32LE(Number(i), 1);
        return buf;
    }
    // 64-bit, 8-byte number
    else if (i < BigInt("0x10000000000000000")) {
        const buf = Buffer.alloc(9);
        buf[0] = 0xff;
        buf.writeBigUInt64LE(BigInt(i), 1);
        return buf;
    }
    // too large
    else {
        throw new Error(`Integer too large ${i}`);
    }
}
