import crypto from "crypto";
import { sha256 } from "@node-lightning/crypto";
import { EnglishWordList } from "./MnemonicWordLists";
import { bigFromBufBE } from "../../bufio/dist";
import { BitcoinError } from "./BitcoinError";
import { BitcoinErrorCode } from "./BitcoinErrorCode";

export function pbkdf2(
    password: Buffer,
    salt: Buffer,
    iterations: number,
    keylen: number,
    hmac: string,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, iterations, keylen, hmac, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

/**
 * Implements mnemonic seed generation methods as specified in BIP39.
 * https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
 */
export class Mnemonic {
    /**
     * Default English word list of 2048 words as specified in BIP39
     */
    public static English = EnglishWordList;

    /**
     * Implements generation of a seed from mnemonic phrase and an
     * optional password for additional security.
     *
     * @remarks
     *
     * This method uses PBKDF2 using HMAC-SHA512 and 2048 rounds to
     * generate a 512-bit seed value. The mnemonic phrase acts as the
     * key password input. The optional password is appended to the
     * salt (default of "mnemonic") so that it is "mnemonic"+password.
     *
     * The mnemonic phrase and password are both encoded with utf-8
     * and use NFKD normalization.
     *
     * @param phrase mnemonic phrase
     * @param password optional passphrase adds additional layer of security
     *
     * @returns
     */
    public static phraseToSeed(phrase: string, password?: string): Promise<Buffer> {
        const key = Buffer.from(phrase.normalize("NFKD"), "utf-8");
        const salt = Buffer.from(("mnemonic" + (password || "")).normalize("NFKD"), "utf-8");
        return pbkdf2(key, salt, 2048, 64, "sha512");
    }

    /**
     * Encodes entropy plus a checksum into a mnemonic phrase by
     * concatenating words from a word list acording to BIP39.
     *
     * @remarks
     * Refer to
     * https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
     *
     * This method requires entropy that is >= 128 bits and <= 256 bits.
     * The entropy bit length must also be divisible by 32 bits.
     *
     * The checksum length is calculated from the bit length of entropy
     * divided by 32.
     *
     * ```
     * CS = ENT / 32
     * ```
     *
     * The checksum then takes the first xx bits from the sha256 of the
     * entropy.
     *
     * ```
     * CS = sha256(ENT)
     * ```
     *
     * From this, the combined value is converted into 11-bit chunks.
     * Each chunk can be represented by a word in the 2048 word list.
     *
     * The follow table shows the relationship between entropy size,
     * checksum size, and words:
     *
     * ```
     * CS = ENT / 32
     * MS = (ENT + CS) / 11
     *
     * |  ENT  | CS | ENT+CS |  MS  |
     * +-------+----+--------+------+
     * |  128  |  4 |   132  |  12  |
     * |  160  |  5 |   165  |  15  |
     * |  192  |  6 |   198  |  18  |
     * |  224  |  7 |   231  |  21  |
     * |  256  |  8 |   264  |  24  |
     * ```
     *
     * @param entropy Valid bit lengths of 128, 160, 192, 224, and 256 bits.
     * @param wordlist Requires a 2048 length word list. Defaults to the
     *
     * @throw {@link BitcoinError} throws if the entropy is not between
     * 128 and 256 bits and is not divisible by 32. Throws if the word
     * list is not 2048 words.
     *
     * @returns The phrase with checksum encoded
     */
    public static entropyToPhrase(entropy: Buffer, wordlist: string[] = Mnemonic.English): string {
        // ensure word list has 2048 words in it
        if (wordlist.length !== 2048) {
            throw new BitcoinError(BitcoinErrorCode.InvalidMnemonicWordList, {
                expected: 2048,
                got: wordlist.length,
            });
        }

        // ensure entropy is the corrent length
        if (entropy.length % 4 > 0 || entropy.length < 16 || entropy.length > 32) {
            throw new BitcoinError(BitcoinErrorCode.InvalidMnemonicEntropy, { entropy });
        }

        // convert the buffer into a bigint so we can more easily perform
        // bit shift operations. The buffer was assumed to be in big-endian
        let num = bigFromBufBE(entropy);

        // calcultes the checkcum bits as ENT / 32
        const checksumBits = entropy.length / 4;

        // extract the first xx bits from the checksum
        const checksum = sha256(entropy)[0] >> (8 - checksumBits);

        // left shift the entropy and encoding the checksum as the lowest
        // bits of our value.
        num <<= BigInt(checksumBits);
        num |= BigInt(checksum);

        // Convert into words by taking 11-bit chunks. We do this by
        // masking the lower 11 bits, the perform a right shift of 11
        // bits until we have consumed the entire entropy length
        const words = [];
        const entropyBits = entropy.length * 8;
        const totalBits = entropyBits + checksumBits;
        for (let bits = 0; bits < totalBits; bits += 11) {
            // find the index and subsequent word using a bitmask
            const index = num & 2047n;
            const word = wordlist[Number(index)];

            // insert the found word into the first position of the array
            // our bits are encoded in LE
            words.unshift(word);

            // consume the 11 bits via right shift
            num >>= 11n;
        }

        // return the concatenated phrase
        return words.join(" ");
    }

    /**
     * Converts a phrase into an entropy buffer. This method extracts
     * and validates the checksum that is included in the phrase.
     *
     * @param phrase mnemonic phrase
     * @param wordlist a word list that must  contain 2048 words
     * @throw {@link BitcoinError} throws if word list does not have 2048
     * words. Throws if there is a word that does not below. Throws if
     * the checksum fails.
     * @returns
     */
    public static phraseToEntropy(phrase: string, wordlist: string[] = Mnemonic.English): Buffer {
        // ensure word list has 2048 words in it
        if (wordlist.length !== 2048) {
            throw new BitcoinError(BitcoinErrorCode.InvalidMnemonicWordList, {
                expected: 2048,
                got: wordlist.length,
            });
        }

        // split phrase into words
        const words = phrase.split(" ");

        // convert words into indices (11-bits each) and throw if we
        // can't find a word
        const indices = [];
        for (const word of words) {
            const index = wordlist.findIndex(p => p === word);
            if (index === -1) {
                throw new BitcoinError(BitcoinErrorCode.InvalidMnemonicWord, { word, phrase });
            }
            indices.push(index);
        }

        // encode words into a number
        let num = 0n;
        for (const index of indices) {
            num <<= 11n;
            num |= BigInt(index);
        }

        // calculate the checksum bits as CS = MS * 11 / 33. This is
        // given from
        //      CS = ENT / 33 and MS
        //      MS = (ENT + CS) / 11
        const checksumBits = BigInt((words.length * 11) / 33);

        // extract the checksum from the lowest values
        const checksumMask = (1n << checksumBits) - 1n;
        const checksum = Number(num & checksumMask);

        // remove the checksum to obtain just the entropy
        num >>= checksumBits;

        // calculate the bits of entropy via 352 * MS / 33 which is
        // obtained from
        //      CS = ENT / 33 and MS
        //      MS = (ENT + CS) / 11
        const entropyBits = (352 * words.length) / 33;
        const entropyBytes = entropyBits / 8;

        // entropy was originally big endian, so we need to do this in
        // reverse
        const entropy = Buffer.alloc(entropyBytes);
        for (let i = entropy.length - 1; i >= 0; i--) {
            entropy[i] = Number(num & 0xffn);
            num >>= 8n;
        }

        // calcualte the checksum and validate that the calculated and
        // extracted values match
        const calcedChecksumBits = entropy.length / 4;
        const calcedChecksum = sha256(entropy)[0] >> (8 - calcedChecksumBits);
        if (calcedChecksum !== checksum) {
            throw new BitcoinError(BitcoinErrorCode.InvalidMnemonicChecksum, {
                expected: checksum,
                got: calcedChecksum,
                phrase,
            });
        }

        return entropy;
    }
}
