/**
 * Converts a Buffer into a a word array and optionally pads bits.
 * This function is needed because the default bech32 fromWords/toWords
 * functions do not allow us to optionally include/exclude padding.
 * The encoder needs to pad bits.  The decoder does not care about the
 * padding bits.
 *
 * @param data input data
 * @param inBits number of bits in, usually 5 or 8
 * @param outBits number of bits out, usualy 8 or 5
 * @param pad indicates if output should be padded
 * @return converted words
 */
export function convertWords(
    data: number[] | Buffer,
    inBits: number,
    outBits: number,
    pad: boolean,
): number[] {
    let value = 0;
    let bits = 0;
    const maxV = (1 << outBits) - 1;

    const result: number[] = [];
    for (let i = 0; i < data.length; ++i) {
        value = (value << inBits) | data[i];
        bits += inBits;

        while (bits >= outBits) {
            bits -= outBits;
            result.push((value >> bits) & maxV);
        }
    }

    if (pad && bits > 0) {
        result.push((value << (outBits - bits)) & maxV);
    }

    return result;
}

/**
 * Calculates the number of words needed to store the number.
 * In bech32, each word is 5 bits (2^5 = 32). To properly
 * encode a number, we need to determine how many words
 * are necessary to encode the value.
 *
 * @param num integer value
 * @returns number of words
 */
export function sizeofNum(num: number): number {
    return Math.ceil(Math.log2(num) / 5);
}

/**
 * Calculates the number of words needed to store
 * the supplied number of bits. In bech32, each words is 5 bits
 * (2^5 = 32).
 *
 * @param bits number of bits
 * @returns number of words
 */
export function sizeofBits(bits: number): number {
    return Math.ceil(bits / 5);
}

/**
 * Calculates the number of words needeed to store
 * the supplied number of bytes. In bech32, each words is 5 bits
 * (2^5 = 32). We first convert the bytes to bits and then
 * convert to words.
 *
 * @param bytes
 * @returns number of words
 */
export function sizeofBytes(bytes: number): number {
    return sizeofBits(bytes * 8);
}
