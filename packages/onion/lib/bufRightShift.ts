/**
 * Shifts the buffer by shifting low index to high index. The top most `num`
 * bytes will be discarded. The bottom most `num` bytes will be 0x00 filled.
 * Returns a newly constructed buffer.
 * @param buf
 * @param num
 */
export function bufRightShift(buf: Buffer, num: number): Buffer {
    const result = Buffer.alloc(buf.length, buf);
    for (let i = result.length - num - 1; i >= 0; i--) {
        result[num + i] = result[i];
    }
    for (let i = 0; i < num; i++) {
        result[i] = 0;
    }
    return result;
}
