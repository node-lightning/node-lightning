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
        readonly tuple: Buffer,
    ) {}

    /**
     * Returns true if the message and public key validate for the
     * signature.
     * @param msg
     * @param pubkey
     * @returns
     */
    public isValid(msg: Buffer, pubkey: PublicKey): boolean {
        return verifySig(msg, this.tuple, pubkey.toBuffer());
    }
}
