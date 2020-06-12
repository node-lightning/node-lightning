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

/**
 * Adds the points together to get a new point
 * @param points public keys that are either compressed or uncompressed
 * @param compressed indicates if the points are compressed or uncompressed
 * @returns a new point as either 33-byte compressed public key or 64-byte
 * uncompresses public key
 */
export function pointAdd(points: Buffer[], compressed: boolean = true): Buffer {
    return secp256k1.publicKeyCombine(points, compressed);
}

/**
 * Scalar multiplies a point by the tweak amount
 * @param point public key in either compressed or uncompressed format
 * @param tweak a 32-byte value that scalar multiplies by the value
 * @param compressed
 * @returns a new point as either 33-byte compressed public key or 64-byte
 * uncompressed public key
 */
export function scalarMul(point: Buffer, tweak: Buffer, compressed: boolean = true): Buffer {
    return secp256k1.publicKeyTweakMul(point, tweak, compressed);
}

/**
 * Performs modular addition on the secret value e by adding the tweak value
 * @param secret 32-byte secret
 * @param tweak 32-byte tweak
 * @returns 32-byte secret
 */
export function privateKeyAdd(secret: Buffer, tweak: Buffer): Buffer {
    return secp256k1.privateKeyTweakAdd(secret, tweak);
}

/**
 * Performs modular multiplication on the secret value e by multiplying by the
 * tweak value
 * @param secret 32-byte secret
 * @param tweak 32-byte tweak
 * @returns 32-byte secret
 */
export function privateKeyMul(secret: Buffer, tweak: Buffer): Buffer {
    return secp256k1.privateKeyTweakMul(secret, tweak);
}
