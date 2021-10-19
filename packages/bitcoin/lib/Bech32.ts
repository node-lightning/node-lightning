const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

/**
 * Encoding utilities for Bech32 encodings as defined in BIP173:
 * https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki#Bech32
 *
 * This encoding uses a human readable part that contain between 1-83
 * US-ASCII characters with char values in the range [33-126].
 *
 * The encoding includes a separator, which is the last "1" in the encoding.
 *
 * Data must be at least 6-characters and is either lowercase or uppercase
 * and excludes the characters "1", "b", "i", and "o".
 */
export class Bech32 {
    /**
     * Encodes the HRP and data according and appends a 6-character
     * checksum.
     * @param hrp human readable part
     * @param words 5-bit words
     * @returns BECH32 encoded string
     */
    public static encode(hrp: string, words: number[]): string {
        const checksum = createChecksum(hrp, words);
        const combined = words.concat(checksum);
        let result = hrp + "1";
        for (let i = 0; i < combined.length; i++) {
            result += ALPHABET[combined[i]];
        }
        return result;
    }

    /**
     * Decodes the BECH32 string into the human readable part and a
     * sequence of 5-bit words. The input can be either upper case or
     * lower case. The last 6-characters are the checksum.
     * @param encoded
     * @returns
     */
    public static decode(encoded: string): { hrp: string; words: number[] } {
        // validate either uppercase or lowercase
        let hasUpper = false;
        let hasLower = false;
        for (const char of encoded) {
            if (char >= "A" && char <= "Z") hasUpper = true;
            if (char >= "a" && char <= "z") hasLower = true;
        }
        if (hasUpper && hasLower) {
            throw new Error("Mixed case");
        }

        // convert to lowercase for processing
        encoded = encoded.toLowerCase();

        // validate HRP length
        const hrpIdx = encoded.lastIndexOf("1");
        if (hrpIdx < 1) {
            throw new Error("too short");
        }
        if (hrpIdx + 7 > encoded.length) {
            throw new Error("too long");
        }

        const hrp = encoded.substring(0, hrpIdx);

        // validate hrp characters
        for (const char of hrp) {
            const code = char.charCodeAt(0);
            if (code < 33 || code > 126) {
                throw new Error("Invalid HRP character");
            }
        }

        const words: number[] = [];
        for (let i = hrpIdx + 1; i < encoded.length; i++) {
            const word = ALPHABET.indexOf(encoded[i]);
            if (word === -1) {
                throw new Error("invalid encoding");
            }
            words.push(word);
        }

        if (!verifyChecksum(hrp, words)) {
            throw new Error("Checksum failed");
        }

        return {
            hrp,
            words: words.slice(0, words.length - 6),
        };
    }

    /**
     * Converts 5-bit words into 8-byte words in a Buffer. When padding
     * is enabled incomplete input words are padded to make a complete
     * output byte. For example, if there are 4-words, this makes 20-bits
     * but requires 3-bytes (24-bits) of data. Padding includes this 3rd
     * byte but include zero bits.
     * @param words
     * @param pad
     * @returns
     */
    public static wordsToBuffer(words: number[], pad: boolean = true): Buffer {
        return Buffer.from(convertWords(words, 5, 8, pad));
    }

    /**
     * Converts a buffer of 8-bit words into 5-bit words. Padding is
     * defaulted to false. For instance if there are 3-bytes (24-bits)
     * we only have 4 5-bit words (20-bits).  The remaining 4-bits will
     * be dropped when pad is false. Otherwise you will get a zero
     * word.
     * @param buffer
     * @param pad default=false
     * @returns
     */
    public static bufferToWords(buffer: Buffer, pad: boolean = false): number[] {
        return convertWords(buffer, 8, 5, pad);
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
    public static sizeofNum(num: number): number {
        if (num === 0) return 1;
        return Math.floor(Math.log(num) / Math.log(2) / 5) + 1;
    }

    /**
     * Calculates the number of words needed to store
     * the supplied number of bits. In bech32, each words is 5 bits
     * (2^5 = 32).
     *
     * @param bits number of bits
     * @returns number of words
     */
    public static sizeofBits(bits: number): number {
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
    public static sizeofBytes(bytes: number): number {
        return Bech32.sizeofBits(bytes * 8);
    }
}

/**
 * Converts a Buffer into a a word array and optionally pads bits.
 *
 * @param data input data
 * @param inBits number of bits in, usually 5 or 8
 * @param outBits number of bits out, usualy 8 or 5
 * @param pad indicates if output should be padded
 * @return converted words
 */
function convertWords(
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

function polymod(values: number[]): number {
    let chk: number = 1;
    for (const value of values) {
        const top = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ value;
        for (let i = 0; i < 5; i++) {
            if ((top >> i) & 1) {
                chk ^= GENERATOR[i];
            }
        }
    }
    return chk;
}

function hrpExpand(hrp: string): number[] {
    const results: number[] = [];
    for (let i = 0; i < hrp.length; i++) {
        results.push(hrp.charCodeAt(i) >> 5);
    }
    results.push(0);
    for (let i = 0; i < hrp.length; i++) {
        results.push(hrp.charCodeAt(i) & 31);
    }
    return results;
}

function verifyChecksum(hrp: string, data: number[]): boolean {
    const combined = hrpExpand(hrp).concat(data);
    const val = polymod(combined);
    return val === 1;
}

function createChecksum(hrp: string, data: number[]): number[] {
    const values = hrpExpand(hrp)
        .concat(data)
        .concat([0, 0, 0, 0, 0, 0]);
    const mod = polymod(values) ^ 1;
    const results: number[] = [];
    for (let i = 0; i < 6; i++) {
        results.push((mod >> (5 * (5 - i))) & 31);
    }
    return results;
}
