import { Base58Check } from "./Base58Check";

export type WifDecodeResult = {
    privateKey: Buffer;
    compressed: boolean;
    prefix: number;
};

export class Wif {
    /**
     * Encodes a private key using the WIF format. Can encode with compressed
     * or uncompressed format and can be for testnet or mainnet.
     *
     * Mainnet prefix: 0x80
     * Testnet prefix: 0xef
     *
     * Algorithm for WIF is:
     * 1. Start with the prefix
     * 2. Encode the secret in 32-byte big-endian format
     * 3. If the SEC format used for the public key address was compressed add
     *    a suffix of 0x01
     * 4. Combine wthe prefix from #1, serialized secret from #2, and suffix from #3
     * 5. Do hash256 of the result from #4 and get the first 4 bytes
     * 6. Take the combination of #4 and #5 and encode it with Base58
     *
     * @param privateKey a 32-byte private key as a big-endian buffer
     * @param compressed default of true
     * @param testnet default of false
     */
    public static encode(privateKey: Buffer, compressed: boolean = true, testnet: boolean = false) {
        // 1. prefix
        const prefix = Buffer.from([testnet ? 0xef : 0x80]);

        // 2. encode as 32-byte big-endian number

        // 3. suffix
        const suffix = compressed ? Buffer.from([0x01]) : Buffer.alloc(0);

        // 4. combine 1, 2, and 3
        return Base58Check.encode(Buffer.concat([prefix, privateKey, suffix]));
    }

    /**
     * To decode a WIF value, we must first decode the base58check
     * input. If this validates then we need to split the resulting
     * buffer of data into two or three parts.
     *
     * The first byte is the prefix
     * The next 32-bytes are the private key
     *
     *
     * @param buf
     */
    public static decode(input: string): WifDecodeResult {
        const raw = Base58Check.decode(input);

        if (raw.length !== 33 && raw.length !== 34) {
            throw new Error("Invalid WIF encoding");
        }

        // prefix is the first byte
        const prefix = raw[0];

        // next 32-bytes are the private key
        const privateKey = raw.slice(1, 33);

        // check for compressed byte
        const compressed = raw.length === 34 && raw[33] === 0x01;

        // return our result object
        return { privateKey, compressed, prefix };
    }
}
