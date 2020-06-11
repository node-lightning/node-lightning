import crypto from "crypto";
import { AesKey } from "./aes-key";

/**
 * Encrypts data using AES
 * @param key symmetric key
 * @param buffer plaintext to encrypt
 */
export function aesEncrypt({ key, buffer }: { key: Buffer; buffer: Buffer }): Buffer {
    const cipher = crypto.createCipher("aes256", key);
    let result = cipher.update(buffer);
    result = Buffer.concat([result, cipher.final()]);
    return result;
}

/**
 * Decrypts data using AES.
 * @param key symmetric key
 * @param buffer ciphertext to decrypt
 */
export function aesDecrypt({ key, buffer }: { key: Buffer; buffer: Buffer }): Buffer {
    const decipher = crypto.createDecipher("aes256", key);
    let result = decipher.update(buffer);
    result = Buffer.concat([result, decipher.final()]);
    return result;
}

/**
 * Generate a a secure key from the passphrase and salt
 * by performing PBKDF2. If no salt is provided one is
 * generated via randomBytes.
 *
 * @param passphrase
 * @param [salt] 16-byte buffer or more
 */
export function createAesKey({ passphrase, salt }: { passphrase: string; salt?: Buffer }): AesKey {
    if (!salt) {
        salt = crypto.randomBytes(16);
    }
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 128, "sha512");
    return {
        key,
        salt,
    };
}
