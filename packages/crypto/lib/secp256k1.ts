import secp256k1 from "secp256k1";

/**
 * Elliptic Curve Diffie-Helman on secp256k1 takes a
 * public key and point multiplies it by the private key.
 * The resulting compressed public key value is hashed via
 * sha256.
 *
 * @param publicKey 33-byte compressed public key
 * @param privateKey  32-byte private key
 * @returns 32-byte sha256 of the point multiple
 */
export function ecdh(publicKey: Buffer, privateKey: Buffer): Buffer {
    return Buffer.from(secp256k1.ecdh(publicKey, privateKey));
}

/**
 * Performs modular multiplication on the secret value by multiplying by the
 * tweak value
 * @param secret 32-byte secret
 * @param tweak 32-byte tweak
 * @returns 32-byte secret
 */
export function privateKeyMul(secret: Buffer, tweak: Buffer): Buffer {
    return Buffer.from(secp256k1.privateKeyTweakMul(secret, tweak));
}
