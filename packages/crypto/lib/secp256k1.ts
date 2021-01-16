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

/**
 * Create an ECDSA signature for the 32-byte message using the private
 * key. This method returns the normalized low-s version of the signature
 * as a 64-byte Buffer (r,s) values.
 * @param msg 32-byte message
 * @param privateKey 32-byte secp256k1 private key
 * @returns signatures as 64-byte buffer with (r,s) pair
 */
export function sign(msg: Buffer, privateKey: Buffer): Buffer {
    const { signature } = secp256k1.ecdsaSign(msg, privateKey);
    const lowS = secp256k1.signatureNormalize(signature);
    return Buffer.from(lowS);
}

/**
 * Encodes a signature into a DER encoding. This encoding is 8-73 bytes
 * in length depending on the length of the s value in the signature.
 * @param sig 64-byte buffer containing (r, s)
 */
export function sigToDER(sig: Buffer): Buffer {
    return Buffer.from(secp256k1.signatureExport(sig));
}

/**
 * Verifies an ECDSA signature and returns true or false
 * if the signatures is valid.
 *
 * @param msg 32-byte message (256 hash or message)
 * @param sig 64-byte
 * @param pubkey 33-byte compressed pubkey
 * @returns true when signature is valid
 */
export function verifySig(msg: Buffer, sig: Buffer, pubkey: Buffer): boolean {
    return secp256k1.ecdsaVerify(sig, msg, pubkey);
}
