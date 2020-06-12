import crypto from "crypto";

/**
 * Hash using SHA256
 *
 * @param data data to hash
 * @returns 32-byte buffer
 */
export function sha256(data: Buffer): Buffer {
    const hash = crypto.createHash("sha256");
    hash.update(data);
    return hash.digest();
}

/**
 * Hash using ripmd160
 *
 * @param data
 * @returns 20-byte buffer
 */
export function hash160(data: Buffer): Buffer {
    const hash = crypto.createHash("ripemd160");
    hash.update(sha256(data));
    return hash.digest();
}

/**
 * Performs double sha256 hash
 *
 * @param data
 * @returns 32-byte buffer
 */
export function hash256(data: Buffer): Buffer {
    return sha256(sha256(data));
}
