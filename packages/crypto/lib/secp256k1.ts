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
    return Buffer.from(secp256k1.privateKeyTweakMul(Buffer.from(secret), tweak));
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
    secp256k1.signatureNormalize(signature);
    return Buffer.from(signature);
}

/**
 * Create an ECDSA signature for the 32-byte message using the private
 * key. This method returns both the signature in the normalized low-s
 * version of the signature as a 64-bte Buffer (r,s) and the recovery
 * identifier.
 * @param msg 32-byte message
 * @param privateKey 32-byte secp256k1 private key
 */
export function signWithRecovery(
    msg: Buffer,
    privateKey: Buffer,
): { signature: Buffer; recovery: number } {
    const { signature, recid } = secp256k1.ecdsaSign(msg, privateKey);
    return {
        signature: Buffer.from(signature),
        recovery: recid,
    };
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

/**
 * Returns true if the signature is a DER encoded signature
 * @param sig a DER encoded signature
 */
export function isDERSig(sig: Buffer): boolean {
    try {
        secp256k1.signatureImport(sig);
        return true;
    } catch (ex) {
        return false;
    }
}

/**
 * Recovers the public key from the signature and recovery identifier
 * for the signed message.
 * @param signature 64-byte signature
 * @param recovery recovery id
 * @param message message that was signed
 * @param compressed whether the pubkey is compressed
 */
export function recoverPubKey(
    signature: Buffer,
    recovery: number,
    message: Buffer,
    compressed: boolean = true,
): Buffer {
    const result = secp256k1.ecdsaRecover(signature, recovery, message, compressed);
    return Buffer.from(result);
}

/**
 * Tweaks a public key by adding tweak * G to the point. The equation is
 * T = P + t*G
 *
 * @param publicKey 33-byte or 65-byte public key
 * @param tweak 32-byte scalar value that is multiplied by G
 * @param compressed true to compress the resulting point
 * @returns the 33-byte compressed or 65-byte uncompressed public key point
 */
export function publicKeyTweakAdd(publicKey: Buffer, tweak: Buffer, compressed: boolean = true) {
    return Buffer.from(secp256k1.publicKeyTweakAdd(publicKey, tweak, compressed));
}

/**
 * Tweaks a public key by multiplying it against a scalar. The equation is
 * T = P * t
 *
 * @param publicKey 33-byte or 65-byte public key
 * @param tweak 32-byte tweak to multiply against the public key
 * @param compressed true to compress the resulting point
 * @returns the 33-byte compressed or 65-byte uncompressed public key point
 */
export function publicKeyTweakMul(publicKey: Buffer, tweak: Buffer, compressed: boolean = true) {
    return Buffer.from(secp256k1.publicKeyTweakMul(publicKey, tweak, compressed));
}

/**
 * Performs point addition
 *
 * @param pubkeys list of 33-byte or 65-byte public keys
 * @param compressed true to compress the resulting point
 * @returns the 33-byte compressed or 65-byte uncompressed public key point
 */
export function publicKeyCombine(pubkeys: Buffer[], compressed: boolean = true): Buffer {
    return Buffer.from(secp256k1.publicKeyCombine(pubkeys, compressed));
}

/**
 * Tweaks a private key by adding a value to it. The question is: e + t.
 *
 * @param privateKey the 32-byte private key
 * @param tweak a 32-byte tweak
 */
export function privateKeyTweakAdd(privateKey: Buffer, tweak: Buffer): Buffer {
    return Buffer.from(secp256k1.privateKeyTweakAdd(Buffer.from(privateKey), tweak));
}

/**
 * Tweaks a private key by multiplying it. The equation is: e * t.
 *
 * @param privateKey the 32-byte private key
 * @param tweak a 32-byte tweak
 */
export function privateKeyTweakMul(privateKey: Buffer, tweak: Buffer): Buffer {
    return Buffer.from(secp256k1.privateKeyTweakMul(Buffer.from(privateKey), tweak));
}
