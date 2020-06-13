/**
 * Performs XOR of the two buffers where only the min length will be XOR'd
 * @param a
 * @param b
 */
export function xor(a: Buffer, b: Buffer) {
    const result = Buffer.alloc(Math.min(a.length, b.length));
    for (let i = 0; i < result.length; i++) {
        result[i] = a[i] ^ b[i];
    }
    return result;
}
