/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import crypto, { CipherCCM, DecipherCCM } from "crypto";

/**
 * Encrypt data using authenticated encryption with associated data (AEAD)
 * ChaCha20-Poly1305.
 *
 * @param k private key, 64-bytes
 * @param n nonce, 12-bytes
 * @param ad associated data
 * @param plaintext raw data to encrypt
 * @returns encrypted data + tag as a variable length buffer
 */
export function ccpEncrypt(k: Buffer, n: Buffer, ad: Buffer, plaintext: Buffer): Buffer {
    const cipher = crypto.createCipheriv("ChaCha20-Poly1305", k, n, {
        authTagLength: 16,
    } as any) as CipherCCM;
    cipher.setAAD(ad, undefined);
    const pad = cipher.update(plaintext);
    cipher.final();
    const tag = cipher.getAuthTag();
    return Buffer.concat([pad, tag]);
}

/**
 * Decrypt data using authenticated encryption with associated data (AEAD)
 * ChaCha20-Poly1305
 *
 * @param k private key, 64-bytes
 * @param n nonce, 12-bytes
 * @param ad associated data, variable length
 * @param cipherText encrypted data to decrypt
 * @returns decrypted data as a variable length Buffer
 */
export function ccpDecrypt(k: Buffer, n: Buffer, ad: Buffer, cipherText: Buffer): Buffer {
    const decipher = crypto.createDecipheriv("ChaCha20-Poly1305", k, n, {
        authTagLength: 16,
    } as any) as DecipherCCM;
    decipher.setAAD(ad, undefined);

    if (cipherText.length === 16) {
        decipher.setAuthTag(cipherText);
        return decipher.final();
    }
    if (cipherText.length > 16) {
        const tag = cipherText.slice(cipherText.length - 16);
        const pad = cipherText.slice(0, cipherText.length - 16);
        decipher.setAuthTag(tag);
        let m = decipher.update(pad);
        const f = decipher.final();
        m = Buffer.concat([m, f]);
        return m;
    }
}
