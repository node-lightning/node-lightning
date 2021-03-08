import crypto from "crypto";
import secp256k1 from "secp256k1";

// const minPrivateKey = BigInt("0x01");
// const maxPrivateKey = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140");

/**
 * Returns true when the Buffer represents a 256-bit number that is between
 * 0x1 and 0xffffffffffffffffffffffffffffffffbaaedce6af48a03bbfd25e8cd0364140
 * as documented in https://en.bitcoin.it/wiki/Private_key
 *
 * @param privKey 32-byte/256-bit buffer
 */
export function validPrivateKey(privKey: Buffer): boolean {
    try {
        return secp256k1.privateKeyVerify(privKey);
    } catch (ex) {
        return false;
    }
}

/**
 * Returns true when the Buffer represents a valid SEC encoded public
 * key stored in a buffer. This expects the prefix and length to be
 * correct.
 * @param pubkey
 */
export function validPublicKey(pubkey: Buffer): boolean {
    try {
        return secp256k1.publicKeyVerify(pubkey);
    } catch (ex) {
        return false;
    }
}

/**
 * Generates a cryptographially secure 256-bit private key
 * that is valid for elliptic curve secp256k1
 *
 * @remarks This method uses crypto.randomBytes to
 * generate the random value. It may be better to use a
 * HRBG
 *
 * @returns the 32-byte/256-bit private key
 */
export function createPrivateKey(): Buffer {
    let result: Buffer;
    do {
        result = crypto.randomBytes(32);
    } while (!validPrivateKey(result));
    return result;
}

/**
 * Gets the public key in the ellitic curve secp256k1
 * from the provided private key
 *
 * @param privKey 32-byte/256-bit private key
 * @returns 33-byte buffer for compressed,
 * 65-byte buffer for uncompressed
 */
export function getPublicKey(privKey: Buffer, compressed = true): Buffer {
    return Buffer.from(secp256k1.publicKeyCreate(privKey, compressed));
}
