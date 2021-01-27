import { bigFromBufBE, bigToBufBE } from "@node-lightning/bufio";

/**
 * Returns a tuple containing the quotient and remainder when the divident (num) is
 * divided by the divisor (mod).
 * @param num divident
 * @param mod divisor
 */
export function divmod(num: bigint, mod: bigint): [bigint, bigint] {
    return [num / mod, num % mod];
}

/**
 * Base58 encoding and decoding utility
 */
export class Base58 {
    public static alphabet: string = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    /**
     * Performs base58 encoding by following this process:
     *
     * 1. Finds the leading zeros an creates 1's that will be
     *    prefixed
     * 2. Converts each value into a base58 character by using
     *    the mod operator on the character.
     * 3. The prefix and results of encoding from the base58 characters
     *    are combined.
     * @param buf
     */
    public static encode(buf: Buffer): string {
        // count the leading zero bytes at the front
        let prefix = "";
        for (let i = 0; i < buf.length; i++) {
            if (buf[i] === 0) prefix += "1";
            else break;
        }

        // determine what base58 digit to use
        let num = bigFromBufBE(buf);
        let result = "";
        while (num > 0n) {
            const [n, mod] = divmod(num, 58n);
            result = Base58.alphabet[Number(mod)] + result;
            num = n;
        }

        // prepend all the prefixed 0's
        return prefix + result;
    }

    /**
     * Decodes a base58 string into its original buffer by constructing
     * a number represented in base58 and converting that number into bytes
     * @param input
     */
    public static decode(input: string): Buffer {
        // determine leading zero bytes which will be prepended
        let prefix = 0;
        for (let i = 0; i < input.length; i++) {
            if (input[i] === "1") prefix += 1;
            else break;
        }

        // process remaining bytes
        let num = 0n;
        for (const char of input) {
            num *= 58n;
            num += BigInt(Base58.alphabet.indexOf(char));
        }

        return Buffer.concat([Buffer.alloc(prefix), bigToBufBE(num)]);
    }
}
