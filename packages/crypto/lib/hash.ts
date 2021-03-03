import crypto from "crypto";

/**
 * Hash using SHA256
 *
 * @param data data to hash
 * @returns 32-byte digest
 */
export function sha256(data: Buffer): Buffer {
    const hash = crypto.createHash("sha256");
    hash.update(data);
    return hash.digest();
}

/**
 * Hash using RIPEM160
 * @param data data to hash, any length
 * @returns 20-byte digest
 */
export function ripemd160(data: Buffer): Buffer {
    const hash = crypto.createHash("ripemd160");
    hash.update(data);
    return hash.digest();
}

/**
 * Hash using ripmd160 and sha256
 *
 * @param data data to hash, any length
 * @returns 20-byte digest
 */
export function hash160(data: Buffer): Buffer {
    return ripemd160(sha256(data));
}

/**
 * Performs double sha256 hash
 *
 * @param data data to hash, any length
 * @returns 32-byte digest
 */
export function hash256(data: Buffer): Buffer {
    return sha256(sha256(data));
}
