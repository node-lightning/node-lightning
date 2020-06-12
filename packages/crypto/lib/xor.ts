/**
 * Performs XOR of the two buffers
 * @param a
 * @param b
 */
export function xor(a: Buffer, b: Buffer) {
    const result = Buffer.alloc(Math.max(a.length, b.length));
    for (let i = 0; i < a.length; i++) {
        if (i < a.length && i < b.length) {
            result[i] = a[i] ^ b[i];
        } else if (i < a.length) {
            result[i] = a[i];
        } else {
            result[i] = b[i];
        }
    }
    return result;
}
