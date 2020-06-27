export class Base32 {
    public static alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    public static pad = "=";

    /**
     * Encodes the buffer using padded Base32 defined in RFC 4648.
     * @param buf
     */
    public static encode(buf: Buffer): string {
        let result: string = "";

        // if nothing, do nothing
        if (!buf.length) return result;

        // Captures the numeric value that we are operating with. This numeric
        // value will allow us to perform simple bit operations and obtain an
        // index value used for the encoding
        let val: number = 0;

        // Captures the number of bits that the current value represents. For
        // example, a value of 00000 is a numeric value of 0 but has 5 bits.
        let valBits: number = 0;

        // Calculate sthe number of data bits for for the buffer. This value is
        // used as input into calculating required number of padding bits.
        const dataBits = buf.length * 8;

        // Calculates the padding bits. Since our input data is 8 bits and our
        // output is 5 bits, the LCM is 40 and we need to add padding bits
        // until we reach a bit length that is evenly divisible by the LCM.
        const padBits = dataBits % 40 === 0 ? 0 : 40 - (dataBits % 40);

        // There are 5 possible scenarios for the padding calculation. This is
        // based on observation and specified in RFC4648:
        //  32 bits => 6 chars of 5 bit padding = 30, 2 bits of padding
        //  24 bits => 4 chars of 5 bit padding = 20, 4 bits of padding
        //  16 bits => 3 chars of 5 bit padding = 15, 1 bit of padding
        //   8 bits => 1 char of 5 bit padding = 5, 3 bits of padding
        switch (padBits) {
            case 32:
                result = Base32.pad.repeat(6);
                valBits = 2;
                break;
            case 24:
                result = Base32.pad.repeat(4);
                valBits = 4;
                break;
            case 16:
                result = Base32.pad.repeat(3);
                valBits = 1;
                break;
            case 8:
                result = Base32.pad;
                valBits = 3;
                break;
        }

        // Create a bitmask for the lowest 5 bits set. We will use this value
        // to read the LSBs from the value
        const mask = 0b11111; // 31

        // We will iterate in reverse order. If we have a twos byte:
        //   [0] = 0b11111111
        //   [1] = 0b10101010
        //
        // We will need to pad 24 bits total, 20 of which can be applied via
        // the pad character. The remaining 4 bits will be mixed with our data.
        //
        // So we start with 4 bits of padding which will be appended to the
        // data:
        //   0b0000:
        //
        // If we combined our two bytes and padding we end up with:
        //   0b11111111101010100000
        //
        // This is 20 bits and can be evenly divided into four 5-bit words:
        //     11111 11110 10101 00000
        //
        // Our algorithm will read these from right to left to minimize the
        // number of bit shift operations that need to be performed.
        for (let i = buf.length - 1; i >= 0; i--) {
            // The first thing we do is read a byte from the input and we left
            // shift it by the number of bits currently in the value.
            // For example if our byte is 11111111 and the current value is
            // made from 3 bits, our new value is 11111111000
            const msbs = buf[i] << valBits;

            // Now that we have shifted the byte we can simply combine the
            // two values. For example if we have 11111111000 and 111, our new
            // value is 11111111111. Finally increase the number of bits that
            // the value is comprised from.
            val |= msbs;
            valBits += 8;

            // Read 5 bit chunks until we need to read another byte. Because we
            // prepadded, the final byte will be evenly divided!
            while (valBits >= 5) {
                // Calculate the mask from the lowest 5 bits
                const index = val & mask;

                // Prepend the character from the index since we are reading
                // data in reverse order. That is the last processed byte will
                // end up being our first character.
                result = Base32.alphabet[index] + result;

                // Remove the lower 5 bits from our value, shift the number of
                // bits that the value is comprised of
                val >>= 5;
                valBits -= 5;
            }
        }

        return result;
    }

    /**
     * Decodes the buffer using padded Base32 defined in RFC 4648.
     * @param input
     */
    public static decode(input: string): Buffer {
        if (!input) return Buffer.alloc(0);

        const inBits = 5;
        const outBits = 8;
        const mask = (1 << outBits) - 1;
        const words = [];

        // Captures the numeric value that we are operating with. This numeric
        // value will allow us to perform simple bit operations and obtain an
        // index value used for the encoding
        let val: number = 0;

        // Captures the number of bits that the current value represents. For
        // example, a value of 00000 is a numeric value of 0 but has 5 bits.
        let valBits: number = 0;

        // We will use a persistent iterator so we can remove the padding and
        // process words until there are zero words left to process. Start at
        // the last character so we can first see how much padding exists.
        let i: number = input.length - 1;

        // Counts the number of padding characters that are at the end end of
        // the encoding and decrement our persistent counter along the way
        let padChars = 0;
        while (input[i] === Base32.pad) {
            padChars++;
            i--;
        }

        // If there were padding characters then the last word contains some
        // padding bits. We will use the number of padding characters to
        // determine the number of padding bits and will process the value of
        // the last word by shifting off the padding bits.
        if (padChars) {
            // Calcuate the padding bits given the padding characters. This is
            // based on the fact that each word is 5-bits and we need to round
            // up to the next multiple of 8. So 6 padding words = 30 bits, and
            // we will have to 2 bits of padding in the preceding word.
            let padBits = 0;
            if (padChars === 6) padBits = 2;
            else if (padChars === 4) padBits = 4;
            else if (padChars === 3) padBits = 1;
            else if (padChars === 1) padBits = 3;

            // Next we extract the last value character and obtain the numeric
            // value for the character in the alphabet.
            const char = input[i];
            const index = Base32.alphabet.indexOf(char);

            // We right shift the value to remove the padding. Normally each
            // word add 5 bits of value. In this case, we reduce the number of
            // bits that make up the value by the number of padding bits.
            val = index >> padBits;
            valBits += inBits - padBits;

            // Decrement the counter since the character has now been processed.
            i--;
        }

        // We can now process the remaining characters
        for (i; i >= 0; i--) {
            // We extract the the character from the input and obtain the
            // numeric value for the character in the alphabet.
            const char = input[i];
            const index: number = Base32.alphabet.indexOf(char);

            // We shift the value to the left so that the word is placed as the
            // most significant bits on the value. This mean that if our word is
            // 0b11111 and the current value has 3 bits we end up with the value
            // 0b11111000.
            const msbs = index << valBits;

            // Next we add the existing value to the new MSB version of our
            // word. For example if the MSB is 0b11111000 and the current 3-bit
            // value is 0b111 we end up with 0b11111111.
            val |= msbs;

            // Finally increase the number of bits that the value is comprised
            // of by the size of the input word.
            valBits += inBits;

            // We can now process the value bits by iterating and obtaining the
            // output bits
            while (valBits >= outBits) {
                // Obtain the lower bits that correspond to the output size
                const word = val & mask;

                // push the word onto the front of the output words. We do this
                // because we are reading the characters in reverse order.
                words.unshift(word);

                // Finally we remove the lower 8 bits and decrement the size of
                // the value bits.
                val >>= outBits;
                valBits -= outBits;
            }
        }

        // Return the Buffer with our original number
        return Buffer.from(words);
    }
}
