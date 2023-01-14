import { verifySig } from "@node-lightning/crypto";
import { PublicKey } from "./PublicKey";

/**
 * Represents an ECDSA signature.
 */
export class EcdsaSig {
    constructor(
        /**
         * 64-byte value representing the tuple of (r,s) for a secp256k1
         * signature.
         */
        readonly raw: Buffer,
    ) {}

    /**
     * Returns true if the message and public key validate for the
     * signature.
     * @param msg
     * @param pubkey
     * @returns
     */
    public isValid(msg: Buffer, pubkey: PublicKey): boolean {
        return verifySig(msg, this.raw, pubkey.toBuffer());
    }

    /**
     * Returns the 64-byte (r,s) tuple for the signature.
     * @returns
     */
    public toBuffer(): Buffer {
        return Buffer.from(this.raw);
    }

    /**
     * Returns the 64-byte (r,s) tuple for the signature encoded into
     * hexadecimal.
     * @returns
     */
    public toHex(): string {
        return this.toBuffer().toString("hex");
    }
}
