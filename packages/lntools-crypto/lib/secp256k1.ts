import secp256k1 from "secp256k1";

/**
 * Elliptic Curve Diffie-Helman on secp256k1 takes a
 * public key and point multiplies it by the private key.
 * The resulting compressed public key value is hashed via
 * sha256.
 *
 * @param rk 33-byte compressed public key
 * @param k  32-byte private key
 * @returns 32-byte sha256 of the point multiple
 */
export function ecdh(rk: Buffer, k: Buffer): Buffer {
    return secp256k1.ecdh(rk, k);
}

/**
 * Verifies an ECDSA signature and returns true or false
 * if the signatures is valid.
 *
 * @param msg 32-byte message (256 hash or message)
 * @param sig 32-byte
 * @param pubkey 33-byte compressed pubkey
 * @returns true when signature is valid
 */
export function verifySig(msg: Buffer, sig: Buffer, pubkey: Buffer): boolean {
    return secp256k1.verify(msg, sig, pubkey);
}
