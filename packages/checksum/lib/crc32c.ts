const constants = generateReversedTable();

/**
 * Performs a CRC32C cyclic redundency check based on RFC3720 specifications
 * for the given Buffer input data.
 *
 * @remarks
 * Definition:
 * https://tools.ietf.org/html/rfc3720#section-12.1
 *
 * Test vectors:
 * https://tools.ietf.org/html/rfc3720#appendix-B.4
 *
 * The formula can be found in
 * http://www.sunshine2k.de/articles/coding/crc/understanding_crc.html#ch73
 *
 * @param buf
 * @returns number
 */
export function crc32c(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        const constantIdx = (crc & 0xff) ^ buf[i];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const constant = constants[constantIdx];
        crc = xor(constant, crc >>> 8);
    }
    return xor(crc, 0xffffffff);
}

/**
 * Generates the constants table for the reversed polynomial representation.
 * This method is better suited for JavaScript where we can use the >>> bitwise
 * unsigned right shift operator to force values to be unsigned integers.
 * The normal, non-reciprocal variant uses left shift operations. We would need
 * to enforce a right shift of >>> 0 after each left shift to ensure we retain
 * an unsigned integer.
 *
 * @remarks
 * More information is available on the table generation in
 * http://www.sunshine2k.de/articles/coding/crc/understanding_crc.html#ch73
 *
 * The constant used to generate the constants table was found in the CRC32C
 * value in the Wikipedia table:
 * https://en.wikipedia.org/wiki/Cyclic_redundancy_check#Polynomial_representations_of_cyclic_redundancy_checks
 */
function generateReversedTable(): number[] {
    const table: number[] = [];
    for (let i = 0; i < 256; i++) {
        let byte = i;
        for (let bit = 0; bit < 8; bit++) {
            if (byte & 0x00000001) {
                byte >>>= 1;
                byte = (byte ^ 0x82f63b78) >>> 0;
            } else {
                byte >>>= 1;
            }
        }
        table[i] = byte;
    }
    return table;
}

/**
 * Bitwise helper that ensures the value stays unsigned after performing xor
 * @param a
 * @param b
 */
function xor(a: number, b: number): number {
    return (a ^ b) >>> 0;
}
