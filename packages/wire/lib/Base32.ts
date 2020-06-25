export class Base32 {
    public static alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    public static padding = "=";

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
                result = result + "=";
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

    public static decode(val: string): Buffer {
        throw new Error();
        // if (!val) return Buffer.alloc(0);
    }
}
