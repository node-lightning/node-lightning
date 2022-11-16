/**
 * Shifts the buffer by shifting high index to low index. The bottom most `num`
 * bytes will be discarded. The top most `num` bytes will be 0x00 filled.
 * Returns a newly constructed buffer.
 * @param buf
 * @param num
 */
export function bufLeftShift(buf: Buffer, num: number): Buffer {
    const result = Buffer.alloc(buf.length, buf);
    for (let i = 0; i < result.length - num; i++) {
        result[i] = result[i + num];
    }
    for (let i = result.length - num; i < result.length; i++) {
        result[i] = 0;
    }
    return result;
}
