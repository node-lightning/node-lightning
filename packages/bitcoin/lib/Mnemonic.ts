import { sha256, pbkdf2 } from "@node-lightning/crypto";
import { EnglishWordList } from "./MnemonicWordLists";
import { bigFromBufBE } from "../../bufio/dist";
import { BitcoinError } from "./BitcoinError";
import { BitcoinErrorCode } from "./BitcoinErrorCode";

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

        // convert the entropy into an array and push the first byte of
        // the checksum into the output
        const input = Array.from(entropy);
        input.push(sha256(entropy)[0]);

        // convert bytes into 11-bit words
        const [indices] = convert(input, 8, 11);

        // map 11-bit words into the actual word
        const words = indices.map(i => wordlist[i]);

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

        // convert entropy words into bytes
        const results = convert(indices, 11, 8);

        // check if we had a remaininer which should happen in all but
        // 24 words. If we had 24 words, there won't be a remaininder,
        // but our checksum will be the final byte.
        let checksum = results[1];
        if (checksum === null) {
            checksum = results[0].pop();
        }

        const entropy = Buffer.from(results[0]);

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

/**
 * Converts words of an input bit size into output words of the output
 * size. Conceptually, this is the equivalent of constructing a giant
 * bit stream from the input words and then consuming the stream using
 * the size of the output bits.
 * @param inWords input words
 * @param inSize bit size of input words
 * @param outSize bit size of output words
 * @returns
 */
function convert(inWords: Iterable<number>, inSize: number, outSize: number): [number[], number] {
    const outWords: number[] = [];

    let bufBits = 0;
    let buf = 0;

    for (const word of inWords) {
        // push each word into the LSBs of a buffer
        bufBits += inSize;
        buf <<= inSize;
        buf |= word;

        // exact out words when buffer is large enough
        while (bufBits >= outSize) {
            // extract word from most significant bits to retain order
            // of inWord insertion
            const remBits = bufBits - outSize;
            const outWord = buf >> remBits;
            outWords.push(outWord);

            // mask remaining least significant bits
            buf &= (1 << remBits) - 1;
            bufBits -= outSize;
        }
    }

    return [outWords, bufBits ? buf : null];
}
