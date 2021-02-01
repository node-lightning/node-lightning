import { hash256 } from "@node-lightning/crypto";
import { Base58 } from "./Base58";
import { BitcoinError } from "./BitcoinError";
import { BitcoinErrorCode } from "./BitcoinErrorCode";

export class Base58Check {
    /**
     * Perform a base58 encoding by appends a 4-byte hash256 checksum
     * at the end of the value.
     * @param buf
     */
    public static encode(buf: Buffer): string {
        return Base58.encode(Buffer.concat([buf, hash256(buf).slice(0, 4)]));
    }

    /**
     * Decodes a base58 check value. Throws error if checksum is invalid
     * @param buf
     */
    public static decode(input: string): Buffer {
        const total = Base58.decode(input);
        const data = total.slice(0, total.length - 4);
        const checksum = total.slice(total.length - 4);
        const hash = hash256(data).slice(0, 4);
        if (!hash.equals(checksum)) {
            throw new BitcoinError(BitcoinErrorCode.Base58ChecksumFailed, {
                actual: hash,
                expected: checksum,
            });
        }
        return data;
    }
}
