export class Base32 {
    public static alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    public static pad = "=";

    /**
     * Encodes the buffer using padded Base32 defined in RFC 4648.
     * @param buf
     */
    public static encode(buf: Buffer): string {
        if (!buf.length) return "";

        let result = "";

        // convert the original number to a bigint, which likely isn't the most
        // efficient way to perform encodings, but the code is much more
        // readable!
        const original = BigInt("0x" + buf.toString("hex"));

        // Calculate the number of bits that we need to left shift our number
        // by. Since our input data is 8 bits and our output is 5 bits, the LCM
        // is 40 and we need to add padding bits until accordingly.
        const dataBits = buf.length * 8;
        const padBits = dataBits % 40 === 0 ? 0 : 40 - (dataBits % 40);

        // pad the orignal number with the required bits to make the number
        // round to 40 bits
        let num = original << BigInt(padBits);

        // creates a datamask with the lowest 5 bits set. We will use this
        // value to read the lsbs from the number
        const mask = 0b11111; // 31

        // at this point, the number may be larger than our original number and
        // the least significant bits. Padding will be the least significant
        // bits and the values will be the most significant bits
        while (num > 0) {
            // the least significant 5 bits will be our value. We mask these
            // values and use that as the character index
            const index = Number(num & BigInt(mask));

            // If the number is still larger than our original value than the
            // current number has padding bits in it.
            const isPadded = num > original;

            // when it is padded an there is no data, we encode the padding
            // character
            if (isPadded && index === 0) {
                result = result + Base32.pad;
            }
            // otherwise the lowest 5 bits will be the index from 0-31 and we
            // prepend the value since we are reading in reverse order
            else {
                result = Base32.alphabet[index] + result;
            }

            // remove the lowest 5 bits
            num >>= BigInt(5);
        }

        return result;
    }

    /**
     * Decodes the buffer using padded Base32 defined in RFC 4648.
     * @param val
     */
    public static decode(val: string): Buffer {
        if (!val) return Buffer.alloc(0);

        // We will read each character and reconstruct the final number that
        // was used to generate the string.
        let num = BigInt(0);

        // Along the way we will count the number of padding characters we
        // enounter, where each character represents 5 bits. We keep count of
        // the padding chars found to help us calculate the padding bits at the
        // end.
        let paddingChars = 0;

        // Iterate each character in our input string
        for (const char of val) {
            // Obtain the index of the current character, or alternative note
            // that we found a padding character
            let index: number;
            if (char === Base32.pad) {
                index = 0;
                paddingChars++;
            } else {
                index = Base32.alphabet.indexOf(char);
            }

            // Shift our number left by 5 bits and add the 5 bits for our index
            // as the least significant bits
            num <<= BigInt(5);
            num += BigInt(index);
        }

        // Now we need to remove the padding bits. RFC4648 discusses that we
        // will encounter a few different scenarios that allows us to calculate
        // the total number of padded characters that were included in our
        // original byte stream. For example, if ther are 6 padding characters
        // ======, where each character is 5 bits, we have 30 bits of padding in
        // the padding characters.  However, we need to decode to an event byte
        // so we round up to 32 bits of padding. The same logic applies for each
        // of the other padding characters.
        let paddingBits: number = 0;
        if (paddingChars === 6) paddingBits = 32;
        else if (paddingChars === 4) paddingBits = 24;
        else if (paddingChars === 3) paddingBits = 16;
        else if (paddingChars === 1) paddingBits = 8;

        // Right shift the padding bits to obtain our original number
        num >>= BigInt(paddingBits);

        // Return the Buffer with our original number
        return Buffer.from(num.toString(16), "hex");
    }
}
